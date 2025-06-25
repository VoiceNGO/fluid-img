import { toKebabCase } from '../to-kebab-case/to-kebab-case';
import { name as packageName } from '../../../package.json';

export const createOptionGetters = <T extends object>(options: T) => {
  const getConstrainedNumber = (_name: keyof T, defaultValue: number, min = 0, max = 1): number => {
    const name = String(_name);
    const value = Number(options[toKebabCase(name) as keyof T] ?? defaultValue);
    if (value < min || value > max) {
      throw new Error(`[${packageName}] \`${name}\` must be between ${min} and ${max}.`);
    }
    return value;
  };

  const getBoolean = (_name: keyof T, defaultValue: boolean): boolean => {
    const name = String(_name);
    const value = options[toKebabCase(name) as keyof T];
    // HTML boolean attributes: presence = true, absence (null) = false, value is ignored
    if (value === null) return false; // Explicitly removed attribute
    return value !== undefined ? true : defaultValue;
  };

  const getEnumValue = <E extends Record<string, string>>(
    _name: keyof T,
    enumObject: E,
    defaultValue: E[keyof E]
  ): E[keyof E] => {
    const name = String(_name);
    const value = options[toKebabCase(name) as keyof T] as string | undefined | null;

    if (value === null || value === undefined) {
      return defaultValue;
    }

    const enumValues = Object.values(enumObject);
    if (enumValues.includes(value)) {
      return value as E[keyof E];
    }

    console.warn(
      `[${packageName}] Invalid value for ${name}: "${value}". Defaulting to "${defaultValue}".`
    );
    return defaultValue;
  };

  return { getConstrainedNumber, getBoolean, getEnumValue };
};
