declare global {
  const USE_RANDOM_GENERATOR: boolean;
  const USE_FULL_GENERATOR: boolean;
  const USE_CACHED_GENERATOR: boolean;

  type PickOptional<T> = {
    [K in keyof T as {} extends Pick<T, K> ? K : never]: T[K];
  };
}

export {};
