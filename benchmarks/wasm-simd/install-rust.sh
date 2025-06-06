#!/bin/bash

echo "Installing Rust..."
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

echo "Adding Rust to PATH for current session..."
source ~/.cargo/env

echo "Adding wasm32 target..."
rustup target add wasm32-unknown-unknown

echo "Installing wasm-pack..."
curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh

echo "Setup complete! You may need to restart your terminal or run 'source ~/.cargo/env'" 