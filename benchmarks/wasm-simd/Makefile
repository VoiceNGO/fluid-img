.PHONY: build serve clean install-deps check-rust fix-rust

check-rust:
	@rustc --version > /dev/null 2>&1 || (echo "Rust not working properly. Run 'make fix-rust'" && exit 1)
	@rustup target list --installed | grep -q wasm32-unknown-unknown || rustup target add wasm32-unknown-unknown

fix-rust:
	@echo "Fixing Rust toolchain..."
	-rustup toolchain uninstall stable-aarch64-apple-darwin
	rustup toolchain install stable
	rustup default stable
	rustup target add wasm32-unknown-unknown
	@echo "Rust toolchain fixed!"

install-deps: fix-rust
	@if ! which wasm-pack > /dev/null; then \
		echo "Installing wasm-pack..."; \
		curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh; \
	fi

build:
	RUSTFLAGS="-C target-feature=+simd128" wasm-pack build --target web --out-dir pkg --release

build-dev:
	RUSTFLAGS="-C target-feature=+simd128" wasm-pack build --target web --out-dir pkg --dev

serve: build
	python3 -m http.server 8000

clean:
	rm -rf pkg target 