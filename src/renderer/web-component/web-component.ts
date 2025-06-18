import { Renderer } from '../renderer/renderer';

function constrain(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function parseNumber(val: string | null, fallback: number): number {
  if (!val) return fallback;
  const parsed = parseFloat(val);
  return isNaN(parsed) ? fallback : parsed;
}

class ImgResponsive extends HTMLElement {
  private renderer: Renderer | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private updateQueue = new Set<string>();

  constructor() {
    super();
  }

  static get observedAttributes(): string[] {
    return [
      'src',
      'carving-priority',
      'max-carve-up-seam-percentage',
      'max-carve-up-scale',
      'max-carve-down-scale',
    ];
  }

  connectedCallback(): void {
    this.setupResizeObserver();
  }

  disconnectedCallback(): void {
    this.renderer?.destroy();
    this.renderer = null;
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (oldValue === newValue) return;

    if (!this.updateQueue.size) {
      setTimeout(this.processUpdates);
    }

    this.updateQueue.add(name);
  }

  private processUpdates = (): void => {
    const changes = Array.from(this.updateQueue);
    this.updateQueue.clear();

    if (changes.includes('src')) {
      this.renderer?.destroy();
      this.renderer = null;
      this.initializeRenderer();
      return;
    }

    if (!this.renderer) return;

    const otherOptions: Record<string, string | null> = {};

    this.renderer.setOptions(otherOptions);
  };

  private initializeRenderer(): void {
    const src = this.getAttribute('src');
    if (!src) return;

    const options = this.getCurrentOptions();
    this.renderer = new Renderer({
      ...options,
      src,
      parentNode: this,
    });
  }

  private calculateDimensions() {
    const width = this.clientWidth ?? 0;
    const height = this.clientHeight ?? 0;

    return { width, height };
  }

  private getAllAttributes(): Record<string, string> {
    const attributes: Record<string, string> = {};

    for (let i = 0; i < this.attributes.length; i++) {
      const attr = this.attributes[i]!;
      if (!['src'].includes(attr.name)) {
        attributes[attr.name] = attr.value;
      }
    }

    return attributes;
  }

  private getCurrentOptions(): Record<string, string | number> {
    const dimensions = this.calculateDimensions();
    const allAttributes = this.getAllAttributes();

    return {
      ...dimensions,
      ...allAttributes,
    };
  }

  private setupResizeObserver(): void {
    if (!this.parentElement) return;

    this.resizeObserver = new ResizeObserver((entries) => {
      const dimensions = this.calculateDimensions();
      this.renderer?.setSize(dimensions.width, dimensions.height);
    });

    this.resizeObserver.observe(this);
  }
}

customElements.define('img-responsive', ImgResponsive);
