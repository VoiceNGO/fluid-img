#!/bin/bash

# Build the WASM package
wasm-pack build --target web --out-dir pkg --dev

# Serve the files (you'll need to run this from the wasm-simd directory)
echo "Build complete! To test:"
echo "cd benchmarks/wasm-simd"
echo "python3 -m http.server 8000"
echo "Then open http://localhost:8000" 