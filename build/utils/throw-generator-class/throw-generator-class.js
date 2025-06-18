export function throwGeneratorClass(className) {
    return class ThrowGeneratorClass {
        constructor() {
            throw new Error(`${className} is not implemented`);
        }
        generateSeamGrid() {
            throw new Error(`${className} is not implemented`);
        }
    };
}
