import './code-preview.css';

const defaultConfig = {
  carvingPriority: 1,
  maxCarveUpSeamPercentage: 0.6,
  maxCarveUpScale: 3,
  maxCarveDownScale: 0.7,
  generator: 'predictive',
  scalingAxis: 'horizontal',
  batchPercentage: 0.1,
  minBatchSize: 10,
};

const CodePreview = ({ config, imageSrc, maskSrc }) => {
  const attributes = [];

  if (imageSrc) {
    attributes.push(`src="${imageSrc}"`);
  }

  if (config.useMask && maskSrc) {
    attributes.push(`mask="${maskSrc}"`);
  }

  if (config.generator !== defaultConfig.generator) {
    attributes.push(`generator="${config.generator}"`);
  }

  if (Number(config.carvingPriority) !== defaultConfig.carvingPriority) {
    attributes.push(`carving-priority="${config.carvingPriority}"`);
  }

  if (Number(config.maxCarveUpSeamPercentage) !== defaultConfig.maxCarveUpSeamPercentage) {
    attributes.push(`max-carve-up-seam-percentage="${config.maxCarveUpSeamPercentage}"`);
  }

  if (Number(config.maxCarveUpScale) !== defaultConfig.maxCarveUpScale) {
    attributes.push(`max-carve-up-scale="${config.maxCarveUpScale}"`);
  }

  if (Number(config.maxCarveDownScale) !== defaultConfig.maxCarveDownScale) {
    attributes.push(`max-carve-down-scale="${config.maxCarveDownScale}"`);
  }

  if (config.scalingAxis !== defaultConfig.scalingAxis) {
    attributes.push(`scaling-axis="${config.scalingAxis}"`);
  }

  if (Number(config.batchPercentage) !== defaultConfig.batchPercentage) {
    attributes.push(`batch-percentage="${config.batchPercentage}"`);
  }

  if (Number(config.minBatchSize) !== defaultConfig.minBatchSize) {
    attributes.push(`min-batch-size="${config.minBatchSize}"`);
  }

  const attributesString = attributes.length > 0 ? ' ' + attributes.join(' ') : '';

  const codeString = `<fluid-img${attributesString}></fluid-img>`;

  return <footer className="code-preview">{codeString}</footer>;
};

export default CodePreview;
