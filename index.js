class MandelbrotRenderer {
  constructor(canvasId) {
    this.cnv = document.getElementById(canvasId);
    /** @type {WebGLRenderingContext} */
    this.gl = this.cnv.getContext('webgl');

    this.scaling = 1;
    this.offsetX = 0;
    this.offsetY = 0;
    this.iterations = 50;

    // Compile shaders
    this.compileProgram();

    // Create buffer of the corner points of the screen
    this.posBuffer = this.createVertexBuffer();

    this.setCanvasSize();
    window.onresize = () => { this.setCanvasSize(); this.render(); };
  }

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

  setCanvasSize() {
    this.gl.canvas.width = window.innerWidth;
    this.gl.canvas.height = window.innerHeight;
    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
  }

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

  static renderShaderSrc(iterations) {
    return `
      precision highp float;
      uniform vec2 resolution;
      uniform float scaling;
      uniform vec2 offsets;
      
      void iterateMandelbrot(inout float r, inout float i, float startR, float startI);
      
      void main() {
          float unit = min(resolution.x / 1.3, resolution.y / 1.1);
          float realStart = ((2.0 * gl_FragCoord.x / unit) - 2.0) / scaling + offsets.x;
          float imStart = (-(2.0 * gl_FragCoord.y / unit) + 1.1) / scaling - offsets.y;
          float real = 0.0;
          float imaginary = 0.0;
          for(int i = 0; i <= ${iterations}; i++) { iterateMandelbrot(real, imaginary, realStart, imStart); }
      
          float absSq = real * real + imaginary * imaginary;
          float brightness = absSq / 50.0;
          if(absSq < 50.0){
              brightness = 1.0;
          }
      
          gl_FragColor = vec4(brightness, brightness, brightness, 1);
      }
      
      void iterateMandelbrot(inout float r, inout float i, float startR, float startI){
          float oldR = r;
          r = r * r - i * i + startR;
          i = 2.0 * oldR * i + startI;
      }
      `;
  }
}

const renderer = new MandelbrotRenderer('mainCanvas');
renderer.render();
