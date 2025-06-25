import { GeneratorType } from '../../utils/types/types';
import { ImgResponsive } from './web-component';

class FluidImgCached extends ImgResponsive {
  protected override GENERATOR: GeneratorType = 'cached';

  constructor() {
    super();
  }
}

customElements.define('fluid-img-cached', FluidImgCached);
