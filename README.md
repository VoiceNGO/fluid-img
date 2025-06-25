# Responsive Image Web Component

Images that scale intelligently to any desired size (within reasonable limits).

![Responsive Images](./resources/images/responsive-images.jpg)

## Usage

```html
<script src="responsive-img.js"></script>
<responsive-img src="image.jpg"></responsive-img>
```

That's it. Scale the images as you wish, and they will just do their thing.

## Versions

There are 4 different components, explained below in detail, but summarized here for those who don't like reading long readme files:

| Component                     | Speed | Quality | Notes                                            |
| ----------------------------- | ----- | ------- | ------------------------------------------------ |
| `<responsive-img>`            | ★★★★★ | ★☆☆☆☆   |                                                  |
| `<responsive-img-predictive>` | ★★★★☆ | ★★★☆☆   |                                                  |
| `<responsive-img-cached>`     | ★★★★★ | ★★★★★   | Requires one-off server-side generation of seams |
| `<responsive-img-full>`       | ☆☆☆☆☆ | ★★★★★   | Not recommended for production use.              |

## Demo

[Demo Here](https://voicengo.github.io/img-responsive/public/responsive-demo.html)

A playground is also available for [experimenting with your own images](https://voicengo.github.io/img-responsive/public).

## Installation

There are two pieces to this: the web components with various generators and the server-side seam generator. While not required, the server-side seam generator produces higher quality results than the client-side generators.

### Client Library

```sh
npm install responsive-image
```

Then import `responsive-image` in your project, which provides and registers the web-component:

```ts
import 'responsive-image';
```

Or include the script from jsdelivr or unpkg:

```html
<script src="https://cdn.jsdelivr.net/npm/package@version/file" />

<!-- or -->

<script src="https://unpkg.com/:package@:version/:file" />
```

### Seam Generator

To use the generator, [Cairo](https://github.com/Automattic/node-canvas) must be installed (this is a dependency of [node-canvas](https://github.com/Automattic/node-canvas)).

| OS      | Command                                                                                                   |
| :------ | :-------------------------------------------------------------------------------------------------------- |
| OS X    | Using [Homebrew](https://brew.sh/):<br />`brew install pkg-config cairo pango libpng jpeg giflib librsvg` |
| Ubuntu  | `sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev`  |
| Fedora  | `sudo yum install gcc-c++ cairo-devel pango-devel libjpeg-turbo-devel giflib-devel`                       |
| Solaris | `pkgin install cairo pango pkg-config xproto renderproto kbproto xextproto`                               |
| OpenBSD | `doas pkg_add cairo pango png jpeg giflib`                                                                |
| Windows | See node-canvas' [wiki](https://github.com/Automattic/node-canvas/wiki/Installation:-Windows)             |
| Others  | See node-canvas' [wiki](https://github.com/Automattic/node-canvas/wiki)                                   |

After cairo is installed, install both canvas and this package via npm:

```sh
npm install responsive-image
```

If you are not compiling seams on a server you can skip the Cairo install.

### Caveats

The responsive image component works best for horizontally or vertically scaling images within a range of approximately 0.5x to 1.5x their original size. While it can handle larger or smaller scales, visual quality may degrade quickly. It is not recommended for images where precise pixel integrity is critical, such as portraits, graphs, or detailed technical drawings, as seam carving introduces distortions. It is highly recommended to test your images at various sizes to ensure they meet your visual expectations.

#### CORS

Due to browser security restrictions, images loaded from a different origin (domain, protocol, or port) than the web page will trigger a Cross-Origin Resource Sharing (CORS) error. This component requires access to the raw pixel data of the image, which is restricted by CORS.

To use images from a different origin, the server hosting the images must be configured to send appropriate CORS headers (e.g., `Access-Control-Allow-Origin: *` or `Access-Control-Allow-Origin: your-domain.com`). Without these headers, the component will not be able to process the image.

#### Fallback

If the component fails to load or process the image, or throws an internal error, it will gracefully degrade to a standard `<img>` tag, ensuring the image is still displayed.

## Options

Usage: `<responsive-img src="image.jpg" generator="random" max-carve-up-scale="5"></responsive-img>`

By default, the `random` generator is used as it is the fastest. However, if a `seam` attribute is provided, the generator will default to `cached`, e.g. `<responsive-img src="image.jpg" seam>` or `<responsive-img src="image.jpg" seam="seamsDir/image.seam">`

| Option                         | Values                   | Default | Description                                                                                                                                                                    |
| ------------------------------ | ------------------------ | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src`                          | URL                      |         | The URL of the image to be processed.                                                                                                                                          |
| `seam-priority`                | Number (0-1, e.g. `0.5`) | `1`     | If set to any value under `1`, the renderer will mix seam carving and traditional image scaling together                                                                       |
| `max-carve-up-seam-percentage` | Number (0-1, e.g. `0.5`) | `0.6`   | The maximum percentage of seams to remove when scaling the image up.                                                                                                           |
| `max-carve-up-scale`           | Number (e.g. `3`)        | `10`    | The maximum scale factor for carving the image up.                                                                                                                             |
| `max-carve-down-scale`         | Number (e.g. `0.5`)      | `1`     | The maximum scale factor for carving the image down.                                                                                                                           |
| `prepare`                      | Boolean                  | false   | If set, generators will create a full set of seams immediately upon load. This prevents a stuttering effect when images are resized fluidly but may add unnecessary processing |

### Generator specific options

Generator-specific options are added to the `<responsive-img>` component but are only valid when the corresponding `generator` attribute is also set

#### Random & Predictive Generator Options

| Option             | Values                | Default | Description                                       |
| ------------------ | --------------------- | ------- | ------------------------------------------------- |
| `batch-percentage` | Number (0-1, e.g 0.1) | 0.1     | The percentage of seams to generate per batch     |
| `min-batch-size`   | Number (e.g. `10`)    | 10      | The minimum number of seams to generate per batch |

#### Full Generator Options

None for now

#### Cached Generator Options

| Option | Values         | Default               | Description                                                                                                      |
| ------ | -------------- | --------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `seam` | Boolean or URL | `{base-src-url}.seam` | The URL of the seam file. If not provided, the path to the image is used, with the extension replaced by `.seam` |

## Seam Generator

To pre-calculate seams for the `cached` generator, use the `npx` command-line tool provided by this package. This tool processes an image and generates a `.seam` file containing the pre-computed seam data. By default, `.seam` files are generated in the same folder as the processed images.

Example usage:

```bash
# Process a single image
npx seams process image.jpg

# Process multiple images
npx seams process image1.jpg image2.png image3.webp

# Process all images in a directory
npx seams process ./images/*.jpg

# Process all images in the current directory and its subdirectories
npx seams process ./**/*.jpg

# Output to a specific directory
npx seams process image.jpg --output-dir ./seams

# Process with specific options
npx seams process image.jpg --percent-seams 50 --vertical
```

### Seam Generator Options

| Option                   | Values         | Default       | Description                                                                                                                                                                                                                                                                                            |
| ------------------------ | -------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--output-dir`, `-o`     | Directory path | Same as input | Directory where .seam files will be saved                                                                                                                                                                                                                                                              |
| `--vertical`, `-v`       | Boolean flag   | `false`       | Calculate vertical seams in addition to horizontal ones                                                                                                                                                                                                                                                |
| `--allow-straight`, `-a` | Boolean flag   | `false`       | Allows straight seams. This has a negligible impact on quality but reduces the file size by approximately 50%.                                                                                                                                                                                         |
| `--step-size`, `-s`      | Number         | `1`           | Seams skip by N pixels, allowing for significantly smaller but less accurate seam files. This makes seam files N<sup>2</sup> times smaller (e.g., a value of 2 results in a file 1/4th the size). A step size of 2 is often not noticeable, but values of 4 or higher can introduce visible artifacts. |
| `--max-seams`            | Number         | `-1`          | Maximum number of seams to calculate (-1 for unlimited)                                                                                                                                                                                                                                                |
| `--percent-seams`, `-p`  | Number (1-100) | `100`         | Percentage of possible seams to calculate                                                                                                                                                                                                                                                              |

## How it works

Seam carving is a content-aware image resizing technique that intelligently removes or adds pixels, allowing an image to be resized without distorting important content. For more information, see the [Wikipedia article](https://en.wikipedia.org/wiki/Seam_carving) on the topic.

Historically, seam carving was too computationally intensive for real-time use in web browsers. However, this limitation can be overcome by pre-calculating seams on a server or by using alternative algorithms that are less demanding and work well in many scenarios.

There are four implementations of the seam carving generator, though the `full` implementation is generally not practical for production environments and is best used for demonstration purposes:

### Random Carving

The random seam carving approach abandons the traditional seam carving algorithm, which is too slow for real-time browser execution.

Instead, it generates a set of random seams that provide 100% image coverage by connecting each pixel in a row to a neighboring pixel in the next. It then iterates through each seam, calculates its energy, and discards a batch of the lowest-energy seams. This process repeats until the desired number of seams is achieved. This method produces surprisingly good results for many images.

### Predictive Carving

Similar to random carving, this method generates an energy map and creates seams in batches. It also generates a minimal energy map for each batch. The core idea is to create both "good" and "bad" seams. Good seams have low energy and are kept. Bad seams incorporate high-energy pixels, allowing them to be filtered out later.

Starting from the first row, it connects pairs of pixels to corresponding pairs in the next row. The lower-energy seam from the running calculation is connected to the lower-energy seam from the minimal energy map.

The result is one truly optimal seam, many "very good" seams, many "very bad" seams, and a lot of mediocre ones. We select a batch of the "good" seams, discard the rest, and repeat the process.

### Full Carving

This method fully calculates optimal seams in the browser. It is useful for demos to preview scaling effects but is too slow for production use.

The algorithm calculates the energy of every pixel, then finds an optimal seam using dynamic programming to build an energy sum table. This optimal seam is removed, both tables are recalculated, and the process repeats.

### Cached Carving

This method uses the `full` carving algorithm but pre-calculates seams on a server to avoid slow, on-the-fly processing in the browser. The pre-calculated seams are compressed into a custom `.seam` file, which is then decoded on the client, providing optimal seams with minimal client-side processing.

## Erm...

I just implemented the Predictive generator. It is, algorithmically, identical to the full generator when set to a batch size of 1, it's just really slow. So I tried that.

Giant MEH. The random generator is literally better in many cases. So I need to re-think the core algorithms. I was playing with a sliding window in the seam generation with decent results, but not sure what I'll end up with yet.

## TODO

### High Priority

- [x] Web component
- [x] Renderer that takes data from generators and scales to any size
- [x] Random generator
- [ ] Vertical carving
- [x] Predictive generator
- [ ] Finish full generator
- [ ] Finish cached generator
- [ ] Web workers for all generators

### Low Priority

- [x] Masking
- [ ] Facial recognition

### Pipe Dream

- [ ] 2D carving

## Licensing

This software is free to use for individuals and organizations with annual gross revenue under $10,000,000 USD. Organizations exceeding this threshold require a commercial license.

**License Summary:**

- **Free**: Individuals, small businesses, and organizations under $10M annual revenue
- **Commercial license required**: Organizations with $10M+ annual revenue
- **Grace period**: 30 days to obtain commercial license after exceeding revenue threshold
