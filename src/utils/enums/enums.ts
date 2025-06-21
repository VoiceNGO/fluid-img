export const ScalingAxis = {
  Horizontal: 'horizontal',
  Vertical: 'vertical',
  Auto: 'auto',
  Dual: 'dual',
} as const;

export type ScalingAxis = (typeof ScalingAxis)[keyof typeof ScalingAxis];
