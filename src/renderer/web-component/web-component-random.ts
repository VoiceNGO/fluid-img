import { GeneratorType } from '../../utils/types/types';
import { ImgResponsive } from './web-component';

class ImgResponsiveRandom extends ImgResponsive {
  protected override GENERATOR: GeneratorType = 'random';

  constructor() {
    super();
  }
}

customElements.define('responsive-img', ImgResponsiveRandom);
