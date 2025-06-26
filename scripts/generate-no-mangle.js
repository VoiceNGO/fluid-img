// Build a regex to exclude all JavaScript built-in properties from esbuild mangling
const allProps = new Set([
  // Web Component lifecycle methods - called directly by the Custom Elements engine
  'connectedCallback',
  'disconnectedCallback',
  'attributeChangedCallback',
  'adoptedCallback',
  'observedAttributes',

  // Service Worker event handlers - called directly by the Service Worker engine
  'install',
  'activate',
  'fetch',
  'message',
  'sync',
  'backgroundfetch',
  'backgroundfetchsuccess',
  'backgroundfetchfail',
  'backgroundfetchabort',
  'backgroundfetchclick',
  'notificationclick',
  'notificationclose',
  'push',
  'pushsubscriptionchange',

  // Payment Handler API - called directly by the Payment engine
  'canmakepayment',
  'paymentrequest',

  // Custom Elements static properties - checked directly by the engine
  'formAssociated',
  'disabledFeatures',

  // Literal keys that must not be mangled.
  'true',
  'false',
  'null',
  'undefined',
]);

const visited = new Set();

function collectAllProps(obj) {
  if (!obj || (typeof obj !== 'object' && typeof obj !== 'function') || visited.has(obj)) {
    return;
  }
  visited.add(obj);

  try {
    // Get own properties, including non-enumerable ones
    for (const prop of Object.getOwnPropertyNames(obj)) {
      allProps.add(prop);
      try {
        collectAllProps(obj[prop]);
      } catch (e) {
        // Can't access property, e.g. on some elements.
      }
    }
    // Also collect from prototype
    collectAllProps(Object.getPrototypeOf(obj));
  } catch (e) {
    // Some objects might not be accessible
  }
}

// Start with window if it's available
if (typeof window !== 'undefined') {
  collectAllProps(window);

  // Collect all possible camel-cased CSS properties by inspecting an element's style object.
  if (document?.createElement) {
    try {
      const style = document.createElement('div').style;
      for (const prop in style) {
        // Add all properties from the style object, filtering out numeric indices.
        if (isNaN(parseInt(prop, 10))) {
          allProps.add(prop);
        }
      }
    } catch (e) {
      console.error('Could not collect CSS properties:', e);
    }
  }
} else {
  console.log(
    '`window` is not defined. This script is intended to be run in a browser environment.'
  );
}

// Convert to sorted array and create regex
const propsArray = Array.from(allProps)
  .sort()
  .filter((prop) => prop.indexOf('$') === -1 && !/^\d+$/.test(prop));
const regexPattern = `${propsArray.join('|')}`;

console.log('Found', propsArray.length, 'built-in properties');
console.log('\nRegex pattern:');
console.log(regexPattern);
