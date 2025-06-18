import { Renderer } from '../renderer/renderer';
class ImgResponsive extends HTMLElement {
    renderer = null;
    resizeObserver = null;
    intersectionObserver = null;
    updateQueue = new Set();
    isIntersecting = false;
    storedDimensions = null;
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
            'on-screen-threshold',
        ];
    }
    connectedCallback() {
        this.setupResizeObserver();
        this.setupIntersectionObserver();
    }
    disconnectedCallback() {
        this.renderer?.destroy();
        this.renderer = null;
        this.resizeObserver?.disconnect();
        this.resizeObserver = null;
        this.intersectionObserver?.disconnect();
        this.intersectionObserver = null;
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
        if (changes.includes('on-screen-threshold')) {
            this.setupIntersectionObserver();
        }
        if (!this.renderer)
            return;
        const otherOptions = changes.reduce((acc, key) => {
            if (key !== 'src' && key !== 'on-screen-threshold') {
                acc[key] = this.getAttribute(key);
            }
            return acc;
        }, {});
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
    getCurrentOptions() {
        const dimensions = this.calculateDimensions();
        const allAttributes = [...this.attributes].reduce((acc, attr) => {
            if (attr.name !== 'src' && attr.name !== 'on-screen-threshold') {
                acc[attr.name] = attr.value;
            }
            return acc;
        }, {});
        return {
            ...dimensions,
            ...allAttributes,
        };
    }
    setupResizeObserver() {
        if (!this.parentElement)
            return;
        this.resizeObserver = new ResizeObserver(() => {
            const dimensions = this.calculateDimensions();
            if (dimensions.height === 0 || dimensions.width === 0)
                return;
            this.storedDimensions = dimensions;
            this.attemptSetSize();
        });
        this.resizeObserver.observe(this);
    }
    setupIntersectionObserver() {
        this.intersectionObserver?.disconnect();
        const threshold = this.getAttribute('on-screen-threshold') || '50px';
        this.intersectionObserver = new IntersectionObserver((entries) => {
            for (const entry of entries) {
                this.isIntersecting = entry.isIntersecting;
                if (this.isIntersecting) {
                    this.attemptSetSize();
                }
            }
        }, {
            rootMargin: `${threshold} ${threshold} ${threshold} ${threshold}`,
        });
        this.intersectionObserver.observe(this);
    }
    attemptSetSize() {
        if (!this.isIntersecting || !this.storedDimensions)
            return;
        this.renderer?.setSize(this.storedDimensions.width, this.storedDimensions.height);
        this.storedDimensions = null;
    }
}
customElements.define('img-responsive', ImgResponsive);
