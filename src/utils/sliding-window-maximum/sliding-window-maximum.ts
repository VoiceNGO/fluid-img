import { Constructor, TypedArray } from 'type-fest';

export class SlidingWindowMaximum<T extends TypedArray = Uint16Array> {
  private timing: Uint16Array;
  private values: T;
  private head: number;
  private tail: number;
  private windowSize: number;
  private time: number;

  constructor(
    windowSize: number,
    initialCapacity: number = 1000,
    ValuesArrayConstructor: Constructor<T> = Uint16Array as any
  ) {
    this.windowSize = windowSize;
    this.timing = new Uint16Array(initialCapacity);
    this.values = new ValuesArrayConstructor(initialCapacity);
    this.tail = 0;
    this.head = 0;
    this.time = 0;
  }

  addAndGetMax(value: number): number {
    this.time++;

    // Remove indices that are outside the window (too old)
    while (this.timing[this.tail]! <= this.time - this.windowSize && this.head > this.tail) {
      this.tail++;
    }

    // Remove indices whose values are smaller than current value
    while (this.values[this.head - 1]! <= value && this.head > this.tail) {
      this.head--;
    }

    // Check if we need to reset before adding
    if (this.head >= this.timing.length) {
      this.timing.set(this.timing.subarray(this.tail, this.head), 0);
      this.values.set(this.values.subarray(this.tail, this.head) as any, 0);
      this.head = this.head - this.tail;
      this.tail = 0;
    }

    // Add current value and timing at head (right side)
    this.values[this.head] = value;
    this.timing[this.head] = this.time;
    this.head++;

    // Return maximum (value at tail)
    return this.values[this.tail] as any;
  }
}
