import { Renderer, RendererConfig } from '../renderer/renderer';
import { ScalingAxis } from '../../utils/enums/enums';
import { toKebabCase } from '../../utils/to-kebab-case/to-kebab-case';
import { GeneratorType } from '../../utils/types/types';

type SeamAttributes = Omit<RendererConfig, 'parentNode' | 'src' | 'width' | 'height' | 'logger'>;

export class ImgResponsive extends HTMLElement {
  protected GENERATOR!: GeneratorType;
  private renderer: Renderer | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private intersectionObserver: IntersectionObserver | null = null;
  private updateQueue = new Set<string>();
  private isIntersecting = false;
  private storedDimensions: { width: number; height: number } | null = null;
  private options: Record<string, string | number | boolean> = {};

  constructor() {
    super();
  }

  static get observedAttributes(): Array<
    keyof SeamAttributes | 'src' | 'mask' | 'on-screen-threshold'
  > {
    const seamAttributes: Array<keyof SeamAttributes> = [
      'carvingPriority',
      'maxCarveUpSeamPercentage',
      'maxCarveUpScale',
      'maxCarveDownScale',
      'scalingAxis',
      'showEnergyMap',
      'demoMode',
    ];

    const kebabCaseAttributes = seamAttributes.map(toKebabCase);

    return ['src', 'mask', 'on-screen-threshold', ...kebabCaseAttributes] as any;
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

    if (changes.includes('src') || changes.includes('scaling-axis') || changes.includes('mask')) {
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
          const value = this.getAttribute(key);
          // For boolean attributes, null (removed) should be explicitly passed
          // For other attributes, null means keep the existing value
          if (key === 'show-energy-map') {
            acc[key] = value; // Pass null explicitly for boolean attributes
          } else if (value !== null) {
            acc[key] = value; // Only pass non-null values for other attributes
          }
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
    if (this.renderer) {
      return;
    }

    const options = this.getOptions();
    this.renderer = new Renderer({
      parentNode: this,
      logger: this.dispatchLogEvent,
      generator: this.GENERATOR,
      ...options,
    });
  }

  private calculateDimensions() {
    const width = this.clientWidth ?? 100;
    const height = this.clientHeight ?? 100;

    return { width, height };
  }

  private getOptions(): any {
    const options: Record<string, any> = {};
    for (const attr of ImgResponsive.observedAttributes) {
      const kebabCaseAttr = toKebabCase(attr);
      if (this.hasAttribute(kebabCaseAttr)) {
        const value = this.getAttribute(kebabCaseAttr);
        if (value === '' || value === 'true') {
          options[attr] = true;
        } else if (value === 'false') {
          options[attr] = false;
        } else {
          options[attr] = this.getAttribute(kebabCaseAttr);
        }
      }
    }
    return options;
  }

  private setupResizeObserver(): void {
    if (!this.parentElement) return;

    this.resizeObserver = new ResizeObserver(() => {
      const dimensions = this.calculateDimensions();

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

  get maxCarveUpScale(): number {
    return this.options['max-carve-up-scale'] as number;
  }
  set maxCarveUpScale(value: number) {
    this.options['max-carve-up-scale'] = value;
    this.renderer?.setOptions({ maxCarveUpScale: value });
  }

  get scalingAxis(): ScalingAxis {
    return this.options['scaling-axis'] as ScalingAxis;
  }
  set scalingAxis(value: ScalingAxis) {
    this.options['scaling-axis'] = value;
    this.renderer?.setOptions({ scalingAxis: value });
  }

  get showEnergyMap(): boolean {
    return this.options['show-energy-map'] as boolean;
  }
  set showEnergyMap(value: boolean) {
    this.options['show-energy-map'] = value;
    this.renderer?.setOptions({ showEnergyMap: value });
  }

  get onScreenThreshold(): number {
    const threshold = this.getAttribute('on-screen-threshold') || '50px';
    return parseInt(threshold.replace('px', ''), 10);
  }
}
