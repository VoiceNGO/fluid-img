import { GeneratorType } from '../../utils/types/types';
import { ImgResponsive } from './web-component';

class FluidImgFull extends ImgResponsive {
  protected override GENERATOR: GeneratorType = 'full';

  constructor() {
    super();
  }
}

customElements.define('fluid-img-full', FluidImgFull);
