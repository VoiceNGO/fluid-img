declare global {
  const GENERATOR: 'random' | 'full' | 'cached' | 'predictive';

  type PickOptional<T> = {
    [K in keyof T as {} extends Pick<T, K> ? K : never]: T[K];
  };
}

export {};
