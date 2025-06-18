export function constrain(val, min, max) {
    return Math.max(min, Math.min(max, val));
}
