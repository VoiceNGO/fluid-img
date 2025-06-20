import esbuild from 'esbuild';

const configs = {
  random: { full: false, random: true, cached: false },
  full: { full: true, random: false, cached: false },
  cached: { full: false, random: false, cached: true },
  all: { full: true, random: true, cached: true },
};

const variant = process.argv[2];
const config = configs[variant];
const inputFile = process.argv[3] || 'build/renderer/renderer/renderer.js';

// Determine output file based on input file
let outputFile;
if (inputFile.includes('web-component.js')) {
  outputFile = 'build/responsive-img-web-component.js';
} else {
  outputFile = `build/renderer-${variant}.minified.js`;
}

esbuild
  .build({
    entryPoints: [inputFile],
    external: [],
    bundle: true,
    outfile: outputFile,
    define: {
      USE_FULL_GENERATOR: config.full.toString(),
      USE_RANDOM_GENERATOR: config.random.toString(),
      USE_CACHED_GENERATOR: config.cached.toString(),
    },
    // minify: true,
  })
  .catch(() => process.exit(1));
