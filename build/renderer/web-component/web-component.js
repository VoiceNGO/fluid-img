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
        return [
            'src',
            'carving-priority',
            'max-carve-up-seam-percentage',
            'max-carve-up-scale',
            'max-carve-down-scale',
        ];
    }
    connectedCallback() {
        this.setupResizeObserver();
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
        const otherOptions = {};
        this.renderer.setOptions(otherOptions);
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
    calculateDimensions() {
        const width = this.clientWidth ?? 0;
        const height = this.clientHeight ?? 0;
        return { width, height };
    }
    getAllAttributes() {
        const attributes = {};
        for (let i = 0; i < this.attributes.length; i++) {
            const attr = this.attributes[i];
            if (!['src'].includes(attr.name)) {
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
        this.resizeObserver.observe(this);
    }
}
customElements.define('img-responsive', ImgResponsive);
