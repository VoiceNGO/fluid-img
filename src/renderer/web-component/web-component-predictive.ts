import { GeneratorType } from '../../utils/types/types';
import { ImgResponsive } from './web-component';

class FluidImgPredictive extends ImgResponsive {
  protected override GENERATOR: GeneratorType = 'predictive';

  constructor() {
    super();
  }
}

customElements.define('fluid-img-predictive', FluidImgPredictive);
