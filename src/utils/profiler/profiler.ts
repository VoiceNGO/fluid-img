export class Profiler {
  #log: (str: string) => void;
  #times = new Map<
    string,
    { startTime: number; minLoggingTime: number; totalNestedTime: number }
  >();
  #activeStack: string[] = [];

  constructor(log: (str: string) => void) {
    this.#log = log;
  }

  start(name: string, minLoggingTime: number = 0): void {
    this.#times.set(name, {
      startTime: performance.now(),
      minLoggingTime,
      totalNestedTime: 0,
    });
    this.#activeStack.push(name);
  }

  end(name: string): void {
    const { startTime, minLoggingTime, totalNestedTime } = this.#times.get(name)!;
    const elapsedTime = performance.now() - startTime;

    if (elapsedTime < minLoggingTime) return;

    const stackSize = this.#activeStack.length;
    if (stackSize > 1) {
      const parentName = this.#activeStack[stackSize - 2]!;
      const parentData = this.#times.get(parentName)!;
      parentData.totalNestedTime += elapsedTime;
    }

    if (totalNestedTime > 0) {
      this.#log(
        `${name}: ${(elapsedTime - totalNestedTime).toFixed(2)}ms (${elapsedTime.toFixed(2)}ms)`
      );
    } else {
      this.#log(`${name}: ${(elapsedTime - totalNestedTime).toFixed(2)}ms`);
    }

    this.#activeStack.pop();
    this.#times.delete(name);
  }
}
