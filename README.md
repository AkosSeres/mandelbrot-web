# [Mandelbrot WebGL](https://akosseres.github.io/mandelbrot-web/)
A fast and performant [Mandelbrot set](https://en.wikipedia.org/wiki/Mandelbrot_set) viewer running in the browser, rendering the image using [WebGL](https://en.wikipedia.org/wiki/WebGL).
Try it out at this [link](https://akosseres.github.io/mandelbrot-web/)!

**Controls**:
* Desktops: zoom with scrolling and move the fractal with dragging the mouse
* Mobiles: pinch zooming and move with single finger
## How?
The page contains a canvas that covers the whole area of the browser viewport. The fractal is drawn to this canvas using WebGL with a pixel (fragment) shader. Since the convergence of a givent point of the Mandelbrot set does not depend on any external parameter and is independent of the convergence of other points, the problem is so easily parralelizable that it can be run inside a pixel shader making the rendering extemely fast. The fragment shader recieves the coordinates of the pixel to be drawn and from that, the real and imaginary part of the initial value can be determined. Then, the shader iterates the value then sets the color of the pixel based on the final calculated value of the sequence.

On high zoom levels, the image kind of falls apart. This limitation comes from the finite precision of floating point numbers.
