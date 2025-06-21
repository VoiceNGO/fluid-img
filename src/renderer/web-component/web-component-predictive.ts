import { GeneratorType } from '../../utils/types/types';
import { ImgResponsive } from './web-component';

class ImgResponsivePredictive extends ImgResponsive {
  protected override GENERATOR: GeneratorType = 'predictive';

  constructor() {
    super();
  }
}

customElements.define('responsive-img-predictive', ImgResponsivePredictive);
