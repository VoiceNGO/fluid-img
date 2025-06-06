#!/bin/bash

echo "Fixing Rust toolchain..."

# Remove the corrupted toolchain
rustup toolchain uninstall stable-aarch64-apple-darwin

# Reinstall the stable toolchain
rustup toolchain install stable

# Set it as default
rustup default stable

# Add wasm32 target
rustup target add wasm32-unknown-unknown

# Install wasm-pack if not present
if ! which wasm-pack > /dev/null; then
    echo "Installing wasm-pack..."
    curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
fi

echo "Rust toolchain fixed!" 