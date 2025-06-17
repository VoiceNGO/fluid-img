export const deterministicBinaryRnd = (seed1) => (seed2) => {
    let h = seed1 ^ seed2;
    h ^= h >>> 16;
    h *= 0x85ebca6b;
    h ^= h >>> 13;
    h *= 0xc2b2ae35;
    h ^= h >>> 16;
    return h & 1;
};
