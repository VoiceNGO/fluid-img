import { Renderer } from '../renderer/renderer';
function constrain(val, min, max) {
    return Math.max(min, Math.min(max, val));
}
function parseNumber(val, fallback) {
    if (!val)
        return fallback;
    const parsed = parseFloat(val);
    return isNaN(parsed) ? fallback : parsed;
}
class ImgResponsive extends HTMLElement {
    renderer = null;
    resizeObserver = null;
    updateQueue = new Set();
    constructor() {
        super();
    }
    static get observedAttributes() {
        return ['src', 'width', 'height', 'min-width', 'max-width', 'min-height', 'max-height'];
    }
    connectedCallback() {
        this.setupResizeObserver();
        this.initializeRenderer();
    }
    disconnectedCallback() {
        this.renderer?.destroy();
        this.renderer = null;
        this.resizeObserver?.disconnect();
        this.resizeObserver = null;
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue)
            return;
        if (!this.updateQueue.size) {
            setTimeout(this.processUpdates);
        }
        this.updateQueue.add(name);
    }
    processUpdates = () => {
        const changes = Array.from(this.updateQueue);
        this.updateQueue.clear();
        if (changes.includes('src')) {
            this.renderer?.destroy();
            this.renderer = null;
            this.initializeRenderer();
            return;
        }
        if (!this.renderer)
            return;
        const dimensionAttributes = [
            'width',
            'height',
            'min-width',
            'max-width',
            'min-height',
            'max-height',
        ];
        const hasDimensionChanges = changes.some((attr) => dimensionAttributes.includes(attr));
        const dimensions = hasDimensionChanges ? this.calculateDimensions() : {};
        const otherOptions = {};
        for (const attr of changes) {
            if (!dimensionAttributes.includes(attr)) {
                otherOptions[attr] = this.getAttribute(attr);
            }
        }
        this.renderer.setOptions({ ...dimensions, ...otherOptions });
    };
    initializeRenderer() {
        const src = this.getAttribute('src');
        if (!src)
            return;
        const options = this.getCurrentOptions();
        this.renderer = new Renderer({
            ...options,
            src,
            parentNode: this,
        });
    }
    getNumericAttribute(name, fallback) {
        return parseNumber(this.getAttribute(name), fallback);
    }
    calculateDimensions(availableWidth, availableHeight) {
        if (availableWidth === undefined || availableHeight === undefined) {
            availableWidth = this.parentElement?.clientWidth ?? 0;
            availableHeight = this.parentElement?.clientHeight ?? 0;
        }
        const requestedWidth = this.getNumericAttribute('width', Math.floor(availableWidth));
        const requestedHeight = this.getNumericAttribute('height', Math.floor(availableHeight));
        const minWidth = this.getNumericAttribute('min-width', 0);
        const maxWidth = this.getNumericAttribute('max-width', Infinity);
        const minHeight = this.getNumericAttribute('min-height', 0);
        const maxHeight = this.getNumericAttribute('max-height', Infinity);
        return {
            width: constrain(requestedWidth, minWidth, maxWidth),
            height: constrain(requestedHeight, minHeight, maxHeight),
            minWidth,
            maxWidth,
            minHeight,
            maxHeight,
        };
    }
    getAllAttributes() {
        const attributes = {};
        for (let i = 0; i < this.attributes.length; i++) {
            const attr = this.attributes[i];
            if (!['src', 'width', 'height', 'min-width', 'max-width', 'min-height', 'max-height'].includes(attr.name)) {
                attributes[attr.name] = attr.value;
            }
        }
        return attributes;
    }
    getCurrentOptions() {
        const dimensions = this.calculateDimensions();
        const allAttributes = this.getAllAttributes();
        return {
            ...dimensions,
            ...allAttributes,
        };
    }
    setupResizeObserver() {
        if (!this.parentElement)
            return;
        this.resizeObserver = new ResizeObserver((entries) => {
            const dimensions = this.calculateDimensions();
            this.renderer?.setSize(dimensions.width, dimensions.height);
        });
        this.resizeObserver.observe(this.parentElement);
    }
}
customElements.define('img-responsive', ImgResponsive);
