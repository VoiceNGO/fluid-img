export class Profiler {
    #log;
    #times = new Map();
    constructor(log) {
        this.#log = log;
    }
    start(name, minLoggingTime = 0) {
        this.#times.set(name, { startTime: performance.now(), minLoggingTime });
    }
    end(name) {
        const { startTime, minLoggingTime } = this.#times.get(name);
        const elapsedTime = performance.now() - startTime;
        if (startTime === undefined || elapsedTime < minLoggingTime)
            return;
        this.#log(`${name}: ${elapsedTime.toFixed(2)}ms`);
        this.#times.delete(name);
    }
}
