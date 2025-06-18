# Responsive Image Web Component

## **_This is not quite production ready. It should be in a few days_**

Images that just scale, intelligently, to whatever size you want them to be (within reasonable limits)

![Responsive Images](./resources/images/responsive-images.jpg)

## Usage

```html
<script src="img-responsive-web-component.js"></script>
<img-responsive src="image.jpg"></img-responsive>
```

That's it. Scale the images however you like, they'll just do their thing.

### Demo

[Demo Here](https://voicengo.github.io/img-responsive/public/responsive-demo.html)

Or, if you want to play with it with your own images, [here is a playground](https://voicengo.github.io/img-responsive/public)

## Options

Usage: `<img-responsive src="image.jpg" generator="random" max-carve-up-scale="5"></img-responsive>`

| Option                         | Values                         | Description                                                                                                              |
| ------------------------------ | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `src`                          | URL                            | The URL of the image to be processed.                                                                                    |
| `generator`                    | `random`, ~`full`~, ~`cached`~ | Specifies the seam carving algorithm to use. `random` or `cached` are recommended, `cached` requires pre-computing seams |
| `max-carve-up-seam-percentage` | Number (0-100)                 | The maximum percentage of seams to remove when scaling the image up.                                                     |
| `max-carve-up-scale`           | Number (e.g., `3`)             | The maximum scale factor for carving the image up.                                                                       |
| `max-carve-down-scale`         | Number (e.g., `0.5`)           | The maximum scale factor for carving the image down.                                                                     |

\* full & cached generators not yet ready

## How it works

Seam carving is a content-aware image resizing technique. It intelligently removes or adds pixels to an image, allowing it to be resized without distorting important content. [Wikedia article](https://en.wikipedia.org/wiki/Seam_carving) on the topic if you want to read more.

Historically, performing seam carving directly within a web browser was impractical due to its computationally intensive nature, requiring significant processing power for real-time image manipulation. However, I'm cheating.

There are three implementations of the seam carving generator, although the full implementation is not practical except for demos:

### Random Carving

The random seam carving is done by throwing away the seam carving algorithm entirely. The traditional algorithm is a loop: calculate energy at every pixel in an image, find a single optimal seam, remove the seam, repeat. While this can be made significantly more efficient via dynamic programming, it is slow now matter how you look at it.

So instead, I'm generating completely random seams, calculating their energy, and discarding the lowest energy seams. Repeat. It generates surprisingly decent results for many images.

Inspired by this whitepaper: [Real-time content-aware image resizing](https://web.archive.org/web/20110707030836/http://vmcl.xjtu.edu.cn/Real-Time%20Content-Aware%20Image%20Resizing.files/real_time_content_aware_image_resizing.pdf)

### Cached Carving

For cached seam carving, one must pre-calculate all the seams in an image on a server. Those seams get compressed into a custom `.seam` file, which is then decoded on the client.

### Full Carving

Exactly what it sounds like. Fully calculates optimum seams in the browser. Useful in a demo to see what an image will look like when scaled, but should not be used in production as it is very slow.

## TODO

### High Priority

- [x] Web component
- [x] Renderer that takes data from generators and scales to any size
- [x] Random generator
- [ ] Vertical carving
- [ ] Random+ generator (see whitepaper linked above)
- [ ] Finish full generator
- [ ] Finish cached generator

## Low Priority

- [ ] Masking
- [ ] Facial recognition

## Pipe Dream

- [ ] 2D carving
