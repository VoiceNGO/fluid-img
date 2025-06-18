export function toCamelCase(str: string): string {
  return str.replace(/-(\w)/g, (_, c) => c.toUpperCase());
}
