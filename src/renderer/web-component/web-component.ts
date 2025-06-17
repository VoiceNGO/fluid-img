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
    return ['src', 'width', 'height', 'min-width', 'max-width', 'min-height', 'max-height'];
  }

  connectedCallback(): void {
    this.setupResizeObserver();
    this.initializeRenderer();
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

    const otherOptions: Record<string, string | null> = {};
    for (const attr of changes) {
      if (!dimensionAttributes.includes(attr)) {
        otherOptions[attr] = this.getAttribute(attr);
      }
    }

    this.renderer.setOptions({ ...dimensions, ...otherOptions });
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

  private getNumericAttribute(name: string, fallback: number): number {
    return parseNumber(this.getAttribute(name), fallback);
  }

  private calculateDimensions(availableWidth?: number, availableHeight?: number) {
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

  private getAllAttributes(): Record<string, string | number> {
    const attributes: Record<string, string | number> = {};

    for (let i = 0; i < this.attributes.length; i++) {
      const attr = this.attributes[i]!;
      if (
        !['src', 'width', 'height', 'min-width', 'max-width', 'min-height', 'max-height'].includes(
          attr.name
        )
      ) {
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

    this.resizeObserver.observe(this.parentElement);
  }
}

customElements.define('img-responsive', ImgResponsive);
