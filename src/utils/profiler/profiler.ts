export class Profiler {
  #log: (str: string) => void;
  #times = new Map<string, { startTime: number; minLoggingTime: number }>();

  constructor(log: (str: string) => void) {
    this.#log = log;
  }

  start(name: string, minLoggingTime: number = 0): void {
    this.#times.set(name, { startTime: performance.now(), minLoggingTime });
  }

  end(name: string): void {
    const { startTime, minLoggingTime } = this.#times.get(name)!;
    const elapsedTime = performance.now() - startTime;

    if (startTime === undefined || elapsedTime < minLoggingTime) return;

    this.#log(`${name}: ${elapsedTime.toFixed(2)}ms`);
    this.#times.delete(name);
  }
}
