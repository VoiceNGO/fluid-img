export function errorBoundary<T extends (this: any, ...args: any[]) => any>(
  originalMethod: T
): (this: ThisParameterType<T>, ...args: Parameters<T>) => ReturnType<T> | void {
  return function replacementMethod(
    this: ThisParameterType<T>,
    ...args: Parameters<T>
  ): ReturnType<T> | void {
    if (this.hasFailed) {
      return;
    }

    try {
      const result = originalMethod.apply(this, args);
      if (result && typeof result.catch === 'function') {
        return result.catch((error: unknown) => {
          this.handleFailure(error);
        });
      }
      return result;
    } catch (error) {
      this.handleFailure(error);
    }
  };
}
