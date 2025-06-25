import { GeneratorType } from '../../utils/types/types';
import { ImgResponsive } from './web-component';

class FluidImgRandom extends ImgResponsive {
  protected override GENERATOR: GeneratorType = 'random';

  constructor() {
    super();
  }
}

customElements.define('fluid-img', FluidImgRandom);
