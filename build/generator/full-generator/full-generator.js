import { throwGeneratorClass } from '../../utils/throw-generator-class/throw-generator-class';
class FullGeneratorClass {
    #imageLoader;
    constructor(options) {
        this.#imageLoader = options.imageLoader;
    }
    async generateSeamGrid(minSeams) {
        return new Uint16Array();
    }
}
export const FullGenerator = USE_FULL_GENERATOR
    ? FullGeneratorClass
    : throwGeneratorClass('FullGenerator');
