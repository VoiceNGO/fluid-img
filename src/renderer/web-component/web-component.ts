import { Renderer } from '../renderer/renderer';

class ImgResponsive extends HTMLElement {
  private renderer: Renderer | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private intersectionObserver: IntersectionObserver | null = null;
  private updateQueue = new Set<string>();
  private isIntersecting = false;
  private storedDimensions: { width: number; height: number } | null = null;

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
      'on-screen-threshold',
    ];
  }

  connectedCallback(): void {
    this.setupResizeObserver();
    this.setupIntersectionObserver();
  }

  disconnectedCallback(): void {
    this.renderer?.destroy();
    this.renderer = null;
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.intersectionObserver?.disconnect();
    this.intersectionObserver = null;
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

    if (changes.includes('on-screen-threshold')) {
      this.setupIntersectionObserver();
    }

    if (!this.renderer) return;

    const otherOptions = changes.reduce(
      (acc, key) => {
        if (key !== 'src' && key !== 'on-screen-threshold') {
          acc[key] = this.getAttribute(key);
        }
        return acc;
      },
      {} as Record<string, string | null>
    );

    this.renderer.setOptions(otherOptions);
  };

  private dispatchLogEvent = (message: string): void => {
    const event = new CustomEvent('log', {
      detail: { message },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  };

  private initializeRenderer(): void {
    const src = this.getAttribute('src');
    if (!src) return;

    const options = this.getCurrentOptions();
    this.renderer = new Renderer({
      ...options,
      src,
      parentNode: this,
      logger: this.dispatchLogEvent,
    });
  }

  private calculateDimensions() {
    const width = this.clientWidth ?? 0;
    const height = this.clientHeight ?? 0;

    return { width, height };
  }

  private getCurrentOptions(): Record<string, string | number> {
    const dimensions = this.calculateDimensions();
    const allAttributes = [...this.attributes].reduce(
      (acc, attr) => {
        if (attr.name !== 'src' && attr.name !== 'on-screen-threshold') {
          acc[attr.name] = attr.value;
        }
        return acc;
      },
      {} as Record<string, string>
    );

    return {
      ...dimensions,
      ...allAttributes,
    };
  }

  private setupResizeObserver(): void {
    if (!this.parentElement) return;

    this.resizeObserver = new ResizeObserver(() => {
      const dimensions = this.calculateDimensions();
      if (dimensions.height === 0 || dimensions.width === 0) return;
      this.storedDimensions = dimensions;
      this.attemptSetSize();
    });

    this.resizeObserver.observe(this);
  }

  private setupIntersectionObserver(): void {
    this.intersectionObserver?.disconnect();

    const threshold = this.getAttribute('on-screen-threshold') || '50px';
    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          this.isIntersecting = entry.isIntersecting;
          if (this.isIntersecting) {
            this.attemptSetSize();
          }
        }
      },
      {
        rootMargin: `${threshold} ${threshold} ${threshold} ${threshold}`,
      }
    );

    this.intersectionObserver.observe(this);
  }

  private attemptSetSize(): void {
    if (!this.isIntersecting || !this.storedDimensions) return;
    this.renderer?.setSize(this.storedDimensions.width, this.storedDimensions.height);
    this.storedDimensions = null;
  }
}

customElements.define('img-responsive', ImgResponsive);
