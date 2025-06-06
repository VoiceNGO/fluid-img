// Google Cloud Function for polyphasic sleep alarm calculator
const https = require('https');

exports.calculateAlarms = async (req, res) => {
  try {
    const throwError = (message, status = 400) => res.status(status).json({ error: message });

    const getNumber = (paramName, defaultValue, min = 0) => {
      const value = req.query[paramName] || defaultValue;
      if (value === undefined) return undefined;
      const num = Number(value);
      if (isNaN(num) || num < min) {
        return responseError(`${paramName} must be a number >= ${min}`);
      }
      return num;
    };

    const getString = (paramName) => req.query[paramName];

    // Extract and convert parameters - NO defaults for required fields
    const lastCycleStartUTC = getString('lastCycleStartUTC');
    const lastCycleDuration = getNumber('lastCycleDuration'); // no default
    const lastSleepDuration = getNumber('lastSleepDuration'); // no default
    const currentDeviceTime = getString('currentDeviceTime');
    const latitude = getNumber('latitude');
    const longitude = getNumber('longitude');
    const targetCycleLength = getNumber('targetCycleLength'); // no default
    const targetSleepDuration = getNumber('targetSleepDuration'); // no default
    const targetAlarmTime = getString('targetAlarmTime');
    const targetOffsetTime = getNumber('targetOffsetTime');
    const targetOffsetRelativeTo = getString('targetOffsetRelativeTo');
    const targetAlarmMinutesBefore = getNumber('targetAlarmMinutesBefore', 10, 0);
    const maxCycleLengthChange = getNumber('maxCycleLengthChange', 10, 0);
    const maxSleepLengthChange = getNumber('maxSleepLengthChange', 1, 0);

    // Validate required inputs
    const requiredFields = [
      'lastCycleStartUTC',
      'lastCycleDuration',
      'lastSleepDuration',
      'currentDeviceTime',
      'targetCycleLength',
      'targetSleepDuration',
    ];

    for (const field of requiredFields) {
      if (req.body[field] === undefined || req.body[field] === null) {
        return throwError(`Missing required field: ${field}`);
      }
    }

    // Validate numeric fields
    const numericFields = [
      { name: 'lastCycleDuration', value: lastCycleDuration, min: 1 },
      { name: 'lastSleepDuration', value: lastSleepDuration, min: 1 },
      { name: 'targetCycleLength', value: targetCycleLength, min: 1 },
      { name: 'targetSleepDuration', value: targetSleepDuration, min: 1 },
      { name: 'targetAlarmMinutesBefore', value: targetAlarmMinutesBefore, min: 0 },
      { name: 'maxCycleLengthChange', value: maxCycleLengthChange, min: 0 },
      { name: 'maxSleepLengthChange', value: maxSleepLengthChange, min: 0 },
    ];

    for (const field of numericFields) {
      if (typeof field.value !== 'number' || isNaN(field.value) || field.value < field.min) {
        return throwError(`${field.name} must be a number >= ${field.min}`);
      }
    }

    // Validate date fields
    const lastStart = new Date(lastCycleStartUTC);
    const deviceTime = new Date(currentDeviceTime);

    if (isNaN(lastStart.getTime())) {
      return throwError('lastCycleStartUTC must be a valid ISO date string');
    }
    if (isNaN(deviceTime.getTime())) {
      return throwError('currentDeviceTime must be a valid ISO date string');
    }

    const hasAlarmTime = targetAlarmTime !== undefined;
    const hasOffsetTarget = targetOffsetTime !== undefined && targetOffsetRelativeTo !== undefined;

    if (hasAlarmTime && hasOffsetTarget) {
      return throwError(
        'Cannot specify both targetAlarmTime AND (targetOffsetTime AND targetOffsetRelativeTo)'
      );
    }

    // Check if target cycle length allows daily alarm alignment
    if ((24 * 60) % targetCycleLength !== 0 && (hasAlarmTime || hasOffsetTarget)) {
      return throwError(
        `Cannot use alarm times with target cycle length ${targetCycleLength} minutes. 24 hours (1440 minutes) must be evenly divisible by cycle length for daily alarm alignment.`
      );
    }

    // Validate targetAlarmTime format if provided
    if (hasAlarmTime) {
      const testDate = new Date(`2000-01-01 ${targetAlarmTime}`);
      if (isNaN(testDate.getTime())) {
        return throwError('targetAlarmTime must be in valid HH:MM format');
      }
    }

    // Validate sun-related fields if provided
    if (hasOffsetTarget) {
      if (typeof targetOffsetTime !== 'number' || isNaN(targetOffsetTime)) {
        return throwError('targetOffsetTime must be a number');
      }

      const validOffsetTypes = [
        'astronomical_twilight_begin',
        'nautical_twilight_begin',
        'civil_twilight_begin',
        'sunrise',
        'solar_noon',
        'sunset',
        'civil_twilight_end',
        'nautical_twilight_end',
        'astronomical_twilight_end',
      ];

      if (!validOffsetTypes.includes(targetOffsetRelativeTo)) {
        return throwError(`targetOffsetRelativeTo must be one of: ${validOffsetTypes.join(', ')}`);
      }

      if (
        typeof latitude !== 'number' ||
        typeof longitude !== 'number' ||
        isNaN(latitude) ||
        isNaN(longitude)
      ) {
        return throwError('latitude and longitude must be numbers');
      }

      if (latitude < -90 || latitude > 90) {
        return throwError('latitude must be between -90 and 90');
      }

      if (longitude < -180 || longitude > 180) {
        return throwError('longitude must be between -180 and 180');
      }
    }

    const serverTime = new Date();

    // Calculate server-to-device time offset
    const timeOffset = deviceTime.getTime() - serverTime.getTime();

    // Normalize lastCycleStartUTC to today's date (keep time, update date)
    const today = new Date(deviceTime);
    const normalizedStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      lastStart.getUTCHours(),
      lastStart.getUTCMinutes(),
      lastStart.getUTCSeconds()
    );

    // Get target time for temporal adjustments
    let targetTime;
    if (hasAlarmTime) {
      const [hours, minutes] = targetAlarmTime.split(':');
      targetTime = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        parseInt(hours),
        parseInt(minutes)
      );
    } else if (hasOffsetTarget) {
      const sunData = await getSunData(latitude, longitude);
      const sunTime = parseSunTime(sunData[targetOffsetRelativeTo]);
      targetTime = new Date(sunTime.getTime() + targetOffsetTime * 60000);
    }

    // Check if cycle is stable (close enough to target to use alarm time adjustments)
    const isStableCycle = Math.abs(lastCycleDuration - targetCycleLength) <= maxCycleLengthChange;
    const hasTargetTime = hasAlarmTime || hasOffsetTarget;

    // First pass: Calculate alarms with no adjustments to find temporal adjustment needed
    let initialCycleAdjustment = 0;
    if (isStableCycle && hasTargetTime) {
      const firstPassAlarms = generateAlarmTimes(
        normalizedStart,
        lastCycleDuration,
        lastSleepDuration,
        today,
        targetAlarmMinutesBefore,
        0,
        0
      );

      // Find closest alarm to target time
      let closestAlarm = null;
      let minDiff = Infinity;

      firstPassAlarms.forEach((alarm) => {
        const diff = Math.abs(alarm.getTime() - targetTime.getTime());
        if (diff < minDiff) {
          minDiff = diff;
          closestAlarm = alarm;
        }
      });

      if (closestAlarm) {
        // Calculate needed adjustment in minutes
        const neededAdjustment = (targetTime.getTime() - closestAlarm.getTime()) / 60000;
        initialCycleAdjustment = Math.max(
          -maxCycleLengthChange,
          Math.min(maxCycleLengthChange, neededAdjustment)
        );
      }
    }

    // Generate final alarms with adjustments
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);

    const alarms = [];
    let currentCycleStart = normalizedStart;
    let currentCycleDuration = lastCycleDuration;
    let currentSleepDuration = lastSleepDuration;

    while (currentCycleStart <= tomorrow) {
      // Calculate adjustments for this cycle
      let cycleAdjustment;
      if (isStableCycle && hasTargetTime) {
        cycleAdjustment = calculateAdjustment(
          currentCycleDuration,
          lastCycleDuration + initialCycleAdjustment,
          maxCycleLengthChange
        );
      } else {
        cycleAdjustment = calculateAdjustment(
          currentCycleDuration,
          targetCycleLength,
          maxCycleLengthChange
        );
      }

      const sleepAdjustment = calculateAdjustment(
        currentSleepDuration,
        targetSleepDuration,
        maxSleepLengthChange
      );

      // Apply adjustments for this cycle
      currentCycleDuration += cycleAdjustment;
      currentSleepDuration += sleepAdjustment;

      // Sleep start alarm (cycle start - buffer)
      const sleepStartAlarm = new Date(
        currentCycleStart.getTime() - targetAlarmMinutesBefore * 60000
      );

      // Sleep end alarm (cycle start + sleep duration)
      const sleepEndAlarm = new Date(currentCycleStart.getTime() + currentSleepDuration * 60000);

      // Only include alarms that fall tomorrow
      if (sleepStartAlarm >= today && sleepStartAlarm <= tomorrow) {
        alarms.push(new Date(sleepStartAlarm.getTime() + timeOffset));
      }
      if (sleepEndAlarm >= today && sleepEndAlarm <= tomorrow) {
        alarms.push(new Date(sleepEndAlarm.getTime() + timeOffset));
      }

      // Move to next cycle
      currentCycleStart = new Date(currentCycleStart.getTime() + currentCycleDuration * 60000);
    }

    // Sort alarms by time
    alarms.sort((a, b) => a.getTime() - b.getTime());

    res.json({
      alarmTimes: alarms.map((alarm) => alarm.toISOString()),
      cycleDuration: currentCycleDuration,
      sleepDuration: currentSleepDuration,
    });
  } catch (error) {
    console.error('Error calculating alarms:', error);
    throwError('Internal server error', 500);
  }
};

function generateAlarmTimes(
  startTime,
  cycleDuration,
  sleepDuration,
  today,
  buffer,
  cycleAdj,
  sleepAdj
) {
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(23, 59, 59, 999);

  const alarms = [];
  let currentCycleStart = startTime;
  let currentCycle = cycleDuration;
  let currentSleep = sleepDuration;

  while (currentCycleStart <= tomorrow) {
    currentCycle += cycleAdj;
    currentSleep += sleepAdj;

    const sleepStartAlarm = new Date(currentCycleStart.getTime() - buffer * 60000);
    const sleepEndAlarm = new Date(currentCycleStart.getTime() + currentSleep * 60000);

    if (sleepStartAlarm >= today && sleepStartAlarm <= tomorrow) {
      alarms.push(sleepStartAlarm);
    }
    if (sleepEndAlarm >= today && sleepEndAlarm <= tomorrow) {
      alarms.push(sleepEndAlarm);
    }

    currentCycleStart = new Date(currentCycleStart.getTime() + currentCycle * 60000);
  }

  return alarms;
}

function calculateAdjustment(current, target, maxChange) {
  const difference = target - current;
  if (Math.abs(difference) <= maxChange) {
    return difference;
  }
  return difference > 0 ? maxChange : -maxChange;
}

async function getSunData(latitude, longitude) {
  return new Promise((resolve, reject) => {
    const url = `https://api.sunrise-sunset.org/json?lat=${latitude}&lng=${longitude}&formatted=0`;

    https
      .get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (json.status === 'OK') {
              resolve(json.results);
            } else {
              reject(new Error('Failed to fetch sun data'));
            }
          } catch (e) {
            reject(e);
          }
        });
      })
      .on('error', reject);
  });
}

function parseSunTime(timeString) {
  return new Date(timeString);
}
