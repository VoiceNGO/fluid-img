#!/usr/bin/env node

import { build } from 'esbuild';
import noMangle from './no-mangle.js';

const DEFINES = {
  RANDOM_GENERATOR: false,
  PREDICTIVE_GENERATOR: false,
  DEMO: false,
  SOBEL_ENERGY_MAP: true,
  DUAL_ENERGY_MAP: false,
  BOUNDARY_AWARE_ENERGY_MAP: false,
};

const webComponentProps =
  'connectedCallback|disconnectedCallback|attributeChangedCallback|observedAttributes|transformOrigin';
const appProps =
  'src|scalingAxis|scaling-axis|mask|generator|carvingPriority|carving-priority|maxCarveUpSeamPercentage|max-carve-up-seam-percentage|maxCarveUpScale|max-carve-up-scale|maxCarveDownScale|max-carve-down-scale|showEnergyMap|show-energy-map|onScreenThreshold|on-screen-threshold';

const ESBUILD_OPTIONS = {
  entryPoints: ['src/renderer/web-component/web-component.ts'],
  bundle: true,
  minify: true,
  sourcemap: true,
  target: 'esnext',
  watch: false,
  mangleProps: /.*/,
  reserveProps: new RegExp(`^(${noMangle}|${webComponentProps}|${appProps})$`),
};

function parseOptions() {
  const args = process.argv.slice(2);
  const options = { ...ESBUILD_OPTIONS };
  const defines = { ...DEFINES };
  const newEntryPoints = [];

  for (const arg of args) {
    if (!arg.startsWith('--')) {
      newEntryPoints.push(arg);
      continue;
    }

    const [key, value] = arg.slice(2).split('=', 2);

    const parsedValue =
      value === undefined ? true : value === 'true' ? true : value === 'false' ? false : value;

    if (key in defines) {
      defines[key] = parsedValue;
    } else {
      options[key] = parsedValue;
    }
  }

  if (newEntryPoints.length > 0) {
    options.entryPoints = newEntryPoints;
  }

  const define = Object.fromEntries(
    Object.entries(defines).map(([k, v]) => [k, JSON.stringify(v)])
  );

  return { ...options, define };
}

function logBuildOptions({ options, watch }) {
  console.log('Building with options:', { ...options, watch });
}

async function startWatch(options) {
  const context = await build({
    ...options,
    plugins: [
      {
        name: 'watch-plugin',
        setup(build) {
          build.onEnd((result) => {
            console.log(`Build ended ${result.errors.length ? 'with errors' : 'successfully'}`);
          });
        },
      },
    ],
  });

  await context.watch();
  console.log('👀 Watching for changes...');
}

async function buildOnce(options) {
  await build(options);
  console.log('✅ Build completed successfully');
}

async function run() {
  const { watch, ...options } = parseOptions();

  logBuildOptions({ options, watch });

  if (watch) {
    await startWatch(options);
  } else {
    await buildOnce(options);
  }
}

run().catch(() => process.exit(1));
