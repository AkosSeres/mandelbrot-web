class MandelbrotRenderer {
  constructor(canvasId) {
    this.cnv = document.getElementById(canvasId);
    /** @type {WebGLRenderingContext} */
    this.gl = this.cnv.getContext('webgl');

    this.scaling = 1;
    this.offsetX = 0;
    this.offsetY = 0;
    this.iterations = 20;

    // Compile shaders
    this.compileProgram();

    // Create buffer of the corner points of the screen
    this.posBuffer = this.createVertexBuffer();

    this.setCanvasSize();
    window.onresize = () => { this.setCanvasSize(); this.render(); };

    // Set event listener for scaling
    this.cnv.addEventListener('click', this.handleClick.bind(this));
  }

  /**
   * Renders the image using the already compiled shaders
   */
  render() {
    this.gl.clearColor(0.8, 0.8, 0.8, 1.0);
    this.gl.clearDepth(1.0);
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.depthFunc(this.gl.LEQUAL);

    // eslint-disable-next-line no-bitwise
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    const vertexPos = this.gl.getAttribLocation(this.shaderProgram, 'aVertexPosition');
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.posBuffer);
    this.gl.vertexAttribPointer(vertexPos, 2, this.gl.FLOAT, false, 0, 0);
    this.gl.enableVertexAttribArray(vertexPos);

    this.gl.useProgram(this.shaderProgram);
    const offset = 0;
    const vertexCount = 4;
    this.gl.uniform2f(this.resolutionLocation, this.gl.canvas.width, this.gl.canvas.height);
    this.gl.uniform1f(this.scalingLocation, this.scaling);
    this.gl.uniform2f(this.offsetsLocation, this.offsetX, this.offsetY);
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, offset, vertexCount);
  }

  /**
   * Loads and compiles the shaders and links them into a program
   */
  compileProgram() {
    // Load vertex shader (only used because it's mandatory)
    this.vertexShader = this.gl.createShader(this.gl.VERTEX_SHADER);
    this.gl.shaderSource(this.vertexShader, document.getElementById('vShader').firstChild.textContent);
    this.gl.compileShader(this.vertexShader);
    // Load the fragment shader used to render the image
    this.renderShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
    this.gl.shaderSource(this.renderShader, MandelbrotRenderer.renderShaderSrc(this.iterations));
    this.gl.compileShader(this.renderShader);
    if (!this.gl.getShaderParameter(this.renderShader, this.gl.COMPILE_STATUS)) {
      throw new Error(`An error occurred compiling the render shader: ${this.gl.getShaderInfoLog(this.renderShader)}`);
    }

    // Link into program
    this.shaderProgram = this.gl.createProgram();
    this.gl.attachShader(this.shaderProgram, this.vertexShader);
    this.gl.attachShader(this.shaderProgram, this.renderShader);
    this.gl.linkProgram(this.shaderProgram);
    // Check for errors
    if (!this.gl.getProgramParameter(this.shaderProgram, this.gl.LINK_STATUS)) {
      throw new Error('Error loading the shaders');
    }

    // Get and store locations
    this.resolutionLocation = this.gl.getUniformLocation(this.shaderProgram, 'resolution');
    this.scalingLocation = this.gl.getUniformLocation(this.shaderProgram, 'scaling');
    this.offsetsLocation = this.gl.getUniformLocation(this.shaderProgram, 'offsets');
  }

  /**
   * Fits the canvas inside the window and centers the set if needed
   */
  setCanvasSize() {
    // Set canvas size and scale according to the device pixel ratio
    const dpr = window.devicePixelRatio || 1;
    this.gl.canvas.width = window.innerWidth * dpr;
    this.gl.canvas.height = window.innerHeight * dpr;
    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);

    // Set offsets that the MB set is in the middle of the screen
    if (this.scaling === 1) {
      const w = (this.gl.canvas.width) / 1.3;
      const h = (this.gl.canvas.height) / 1.1;
      const unit = Math.min(w, h);
      if (w >= h) {
        this.offsetX = -(w - h) / unit;
        this.offsetY = 0;
      } else {
        this.offsetY = -(h - w) / unit;
        this.offsetX = 0;
      }
    }
  }

  /**
   * Just creates a buffer containing the corner vertices of the screen
   */
  createVertexBuffer() {
    const buffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER,
      new Float32Array([
        -1.0, 1.0,
        1.0, 1.0,
        -1.0, -1.0,
        1.0, -1.0,
      ].map((n) => n)),
      this.gl.STATIC_DRAW);
    return buffer;
  }

  /**
   * Converts a point in screen space [0, width] x [0, height] to the point on the comlex plane
   *
   * @param {number} _x The x coordinate
   * @param {number} _y The y coordinate
   * @returns {r: number, i: number} The comlex number on the complex plane
   */
  toComplexSpace(_x, _y) {
    const ret = { r: 0, i: 0 };

    const dpr = window.devicePixelRatio || 1;
    const w = (this.gl.canvas.width) / 1.3;
    const h = (this.gl.canvas.height) / 1.1;
    const unit = Math.min(w, h);
    const x = _x * dpr;
    const y = _y * dpr;

    ret.r = (((2 * x) / unit) - 2) / this.scaling + this.offsetX;
    ret.i = (-((2 * y) / unit) + 1.1) / this.scaling - this.offsetY;

    return ret;
  }

  scaleAround(scalingFactor, _centerX, _centerY) {
    const newScaling = this.scaling * scalingFactor;
    const dpr = window.devicePixelRatio || 1;
    const w = (this.gl.canvas.width) / 1.3;
    const h = (this.gl.canvas.height) / 1.1;
    const unit = Math.min(h, w);
    const centerX = _centerX * dpr;
    const centerY = (_centerY) * dpr;

    this.offsetX = ((2 * centerX) / unit - 2)
    * ((1 / this.scaling) - (1 / newScaling)) + this.offsetX;

    this.offsetY = -(-(2 * centerY) / (unit) + 1.1)
    * ((1 / newScaling) - (1 / this.scaling)) + this.offsetY;

    this.scaling = newScaling;
  }

  /**
   * Function for handling mouse clicks
   *
   * @param {MouseEvent} event The incoming event
   */
  handleClick(event) {
    this.scaleAround(1.1, event.clientX, event.clientY);
    this.iterations *= Math.sqrt(Math.sqrt(1.1));
    this.compileProgram();
    this.render();
  }

  /**
   * Generates source code for the pixel shader used to render the image
   *
   * @param {number} iterations The number of iterations to have
   * @param {number} greyscale If set to true, the resulting image will be a greyscale image
   */
  static renderShaderSrc(iterations, greyscale = false) {
    return `
      precision highp float;
      uniform vec2 resolution;
      uniform float scaling;
      uniform vec2 offsets;
      
      void iterateMandelbrot(inout float r, inout float i, float startR, float startI);
      vec3 huetorgb(in float hue);
      
      void main() {
          float unit = min(resolution.x / 1.3, resolution.y / 1.1);
          float realStart = ((2.0 * gl_FragCoord.x / unit) - 2.0) / scaling + offsets.x;
          float imStart = (-(2.0 * gl_FragCoord.y / unit) + 1.1) / scaling - offsets.y;
          float real = 0.0;
          float imaginary = 0.0;
          for(int i = 0;i < ${Math.round(iterations)};i++) iterateMandelbrot(real, imaginary, realStart, imStart);
      
          float absSq = real * real + imaginary * imaginary;
          ${(() => {
    if (greyscale) {
      return `
                float brightness = absSq;
                if(absSq < 10.0){
                    brightness = 1.0;
                }else{
                    brightness = fract(absSq);
                }
                gl_FragColor = vec4(brightness, brightness, brightness, 1.0);
                `;
    }
    return `
                vec3 color = huetorgb(absSq * 400.0 / ${iterations.toFixed(2)});
                float mult = 1.0;
                if(color == vec3(1.0, 1.0, 1.0)) mult = 0.0;
                gl_FragColor = vec4(mult * color, 1.0);
                `;
  })()
}
      }
      
      void iterateMandelbrot(inout float r, inout float i, float startR, float startI){
          float oldR = r;
          r = r * r - i * i + startR;
          i = 2.0 * oldR * i + startI;
      }

      // Function to convert a hue value to rgb with 1.0 saturation and 0.0 brightness
      // Implemented based on a wikipedia article
      vec3 huetorgb(in float hue){
        float k5 = mod(5.0 + hue, 6.0);
        float k3 = mod(3.0 + hue, 6.0);
        float k1 = mod(1.0 + hue, 6.0);
        float f5 = 1.0 - max(0.0, min(min(k5, 4.0 - k5), 1.0));
        float f3 = 1.0 - max(0.0, min(min(k3, 4.0 - k3), 1.0));
        float f1 = 1.0 - max(0.0, min(min(k1, 4.0 - k1), 1.0));
        return vec3(f5, f3, f1);
      }
      `;
  }
}

const renderer = new MandelbrotRenderer('mainCanvas');
renderer.render();
