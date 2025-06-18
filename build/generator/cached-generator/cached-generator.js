import { throwGeneratorClass } from '../../utils/throw-generator-class/throw-generator-class';
class CachedGeneratorClass {
    #imageLoader;
    constructor(options) {
        this.#imageLoader = options.imageLoader;
    }
    async generateSeamGrid(minSeams) {
        return new Uint16Array();
    }
}
export const CachedGenerator = USE_CACHED_GENERATOR
    ? CachedGeneratorClass
    : throwGeneratorClass('CachedGenerator');
