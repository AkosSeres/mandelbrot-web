/* eslint-disable radix */
const DROPPED_RES = 0.5;

class MandelbrotRenderer {
  constructor(canvasId) {
    this.cnv = document.getElementById(canvasId);
    /** @type {WebGLRenderingContext} */
    this.gl = this.cnv.getContext('webgl', {
      alpha: false,
      desynchronized: true,
      antialias: false,
      preserveDrawingBuffer: false,
    });

    this.scaling = 1;
    this.offsetX = 0;
    this.offsetY = 0;
    this.iterations = 20;
    this.autoSetIter = true;
    document.getElementById('autoCheckbox').checked = true;

    /** Can drop the resolution with this to gain performance
        (setCanvasSize has to be called to take effect). Default is 1. */
    this.resolutionScaling = 1;

    // Compile shaders
    this.compileProgram();

    // Create buffer of the corner points of the screen
    this.posBuffer = this.createVertexBuffer();

    this.setCanvasSize();
    this.resetView();
    window.onresize = () => { this.setCanvasSize(); this.render(); };

    // Set event listeners for scaling
    this.cnv.addEventListener('wheel', this.handleScroll.bind(this));

    // Set event listeners for moving the viewport
    this.cnv.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.cnv.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.cnv.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.cnv.addEventListener('touchstart', this.handleTouchStart.bind(this));
    this.cnv.addEventListener('touchend', this.handleTouchEnd.bind(this));
    this.cnv.addEventListener('touchmove', this.handleTouchMove.bind(this));
    this.mouseIsDown = false;
    /** @type {number[]} */
    this.touchIDs = [];
    /** @type {{x:number,y:number}[]} */
    this.touchCoords = [];
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

    // Set value of iterations input
    document.getElementById('iterInput').value = this.iterations.toFixed();
  }

  iterationsChanged(input) {
    let newVal = Math.floor(input.valueAsNumber);
    if (newVal < Number.parseInt(input.min))newVal = Number.parseInt(input.min);
    if (newVal > Number.parseInt(input.max))newVal = Number.parseInt(input.max);
    this.iterations = newVal;
    this.compileProgram();
    this.render();
  }

  /**
   * Fits the canvas inside the window and centers the set if needed
   */
  setCanvasSize() {
    // Set canvas size and scale according to the device pixel ratio
    let dpr = window.devicePixelRatio || 1;
    dpr *= this.resolutionScaling;
    this.gl.canvas.width = window.innerWidth * dpr;
    this.gl.canvas.height = window.innerHeight * dpr;
    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
  }

  resetView() {
    // Set offsets that the MB set is in the middle of the screen
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

    let dpr = window.devicePixelRatio || 1;
    dpr *= this.resolutionScaling;
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
    let dpr = window.devicePixelRatio || 1;
    dpr *= this.resolutionScaling;
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
   * Handles mouse down events on the canvas
   *
   * @param {MouseEvent} event The event sent
   */
  handleMouseDown(event) {
    event.preventDefault();

    this.mouseIsDown = true;
    this.resolutionScaling = DROPPED_RES;
    this.setCanvasSize();
  }

  /**
   * Handles mouse up events on the canvas
   *
   * @param {MouseEvent} event The event sent
   */
  handleMouseUp(event) {
    event.preventDefault();

    this.mouseIsDown = false;
    this.resolutionScaling = 1;
    this.setCanvasSize();
    this.render();
  }

  /**
   * Handles touch start events on the canvas
   *
   * @param {TouchEvent} event The event sent
   */
  handleTouchStart(event) {
    this.mouseIsDown = true;

    event.preventDefault();
    if (event.touches.length > 1) {
      if (event.touches.length === 2) {
        // Save touches
        this.touchIDs = [];
        this.touchCoords = [];
        this.touchIDs.push(event.touches[0].identifier);
        this.touchIDs.push(event.touches[1].identifier);
        this.touchCoords.push(
          {
            x: event.touches[0].clientX,
            y: event.touches[0].clientY,
          },
        );
        this.touchCoords.push(
          {
            x: event.touches[1].clientX,
            y: event.touches[1].clientY,
          },
        );
      }
      if (event.touches.length > 2) {
        this.touchIDs = [];
        this.touchCoords = [];
      }
      return false;
    } if (event.touches.length === 1) {
      this.touchIDs = [event.touches[0].identifier];
      this.touchCoords = [{
        x: event.touches[0].clientX,
        y: event.touches[0].clientY,
      }];

      this.mouseIsDown = true;
      this.resolutionScaling = DROPPED_RES;
      this.setCanvasSize();
    }
    return false;
  }

  /**
   * Handles touch end events on the canvas
   *
   * @param {TouchEvent} event The event sent
   */
  handleTouchEnd(event) {
    event.preventDefault();

    if (event.touches.length > 1) {
      if (event.touches.length === 2) {
        // Save touches
        this.touchIDs = [];
        this.touchCoords = [];
        this.touchIDs.push(event.touches[0].identifier);
        this.touchIDs.push(event.touches[1].identifier);
        this.touchCoords.push(
          {
            x: event.touches[0].clientX,
            y: event.touches[0].clientY,
          },
        );
        this.touchCoords.push(
          {
            x: event.touches[1].clientX,
            y: event.touches[1].clientY,
          },
        );
      }
      if (event.touches.length > 2) {
        this.touchIDs = [];
        this.touchCoords = [];
      }
      return false;
    } if (event.touches.length === 1) {
      this.touchIDs = [event.touches[0].identifier];
      this.touchCoords = [{
        x: event.touches[0].clientX,
        y: event.touches[0].clientY,
      }];
    }
    if (event.touches.length === 0) {
      this.touchIDs = [];
      this.touchCoords = [];

      this.mouseIsDown = false;
      this.resolutionScaling = 1;
      this.setCanvasSize();
      this.setAutoIterations();
      this.render();
    }
    this.mouseIsDown = false;

    return false;
  }

  setAutoIterations() {
    if (!this.autoSetIter) return;
    this.iterations = (this.scaling ** 0.25) * 20;
    this.compileProgram();
  }

  /**
   * Handles touch move events
   *
   * @param {TouchEvent} event The event sent
   */
  handleTouchMove(event) {
    event.preventDefault();

    if (event.touches.length === 2) {
      let touches = [];
      if ((event.touches.item(0)).identifier === this.touchIDs[0]) {
        touches.push(event.touches.item(0));
        touches.push(event.touches.item(1));
      } else {
        touches.push(event.touches.item(1));
        touches.push(event.touches.item(0));
      }
      touches = touches.map((t) => (
        { x: t.clientX, y: t.clientY }));
      this.processMultiTouchGesture(this.touchCoords, touches);
      this.touchCoords = touches;
      return false;
    }
    if (event.touches.length > 2) return false;

    // Now we only have 1 touches so do movement
    const movementX = event.touches[0].clientX - this.touchCoords[0].x;
    const movementY = event.touches[0].clientY - this.touchCoords[0].y;

    const origo = this.toComplexSpace(0, 0);
    const movementC = this.toComplexSpace(movementX, movementY);

    this.offsetX += (origo.r - movementC.r);
    this.offsetY += (origo.i - movementC.i);
    this.render();

    this.touchIDs = [event.touches[0].identifier];
    this.touchCoords = [{
      x: event.touches[0].clientX,
      y: event.touches[0].clientY,
    }];
    return false;
  }

  /**
   * Processes gestures with 2 touches present
   * @param {{x:number,y:number}[]} oldCoords The old coordinates of the touches
   * @param {{x:number,y:number}[]} newCoords The new coordinates of the touches
   */
  processMultiTouchGesture(oldCoords, newCoords) {
    const oldCenter = {
      x: oldCoords[1].x + oldCoords[0].x,
      y: oldCoords[1].y + oldCoords[0].y,
    };
    oldCenter.x *= (0.5);
    oldCenter.y *= (0.5);
    const newCenter = {
      x: newCoords[1].x + newCoords[0].x,
      y: newCoords[1].y + newCoords[0].y,
    };
    newCenter.x *= (0.5);
    newCenter.y *= (0.5);
    const oldLen = (((oldCoords[0].x - oldCoords[1].x) ** 2)
    + ((oldCoords[0].y - oldCoords[1].y) ** 2)) ** 0.5;
    const newLen = (((newCoords[0].x - newCoords[1].x) ** 2)
    + ((newCoords[0].y - newCoords[1].y) ** 2)) ** 0.5;
    const scalingFactor = Math.sqrt(newLen / oldLen);
    const middleCenter = {
      x: oldCenter.x + newCenter.x,
      y: oldCenter.y + newCenter.y,
    };
    middleCenter.x *= (0.5);
    middleCenter.y *= (0.5);
    const toMove = {
      x: newCenter.x - oldCenter.x,
      y: newCenter.y - oldCenter.y,
    };
    toMove.x *= (scalingFactor);
    toMove.y *= (scalingFactor);
    this.scaleAround(scalingFactor, middleCenter.x, middleCenter.y);

    const origo = this.toComplexSpace(0, 0);
    const movementC = this.toComplexSpace(toMove.x, toMove.y);

    this.offsetX += (origo.r - movementC.r);
    this.offsetY += (origo.i - movementC.i);
    this.render();
  }

  /**
   * Handles mouse move events on the canvas
   *
   * @param {MouseEvent} event The event sent
   */
  handleMouseMove(event) {
    event.preventDefault();
    if (!this.mouseIsDown) return;

    const origo = this.toComplexSpace(0, 0);
    const movementC = this.toComplexSpace(event.movementX, event.movementY);

    this.offsetX += (origo.r - movementC.r);
    this.offsetY += (origo.i - movementC.i);
    this.render();
  }

  /**
   * Function for handling scroll events
   *
   * @param {WheelEvent} event The incoming event
   */
  handleScroll(event) {
    event.preventDefault();

    const scalingFactor = 1.001 ** (-event.deltaY);
    this.scaleAround(scalingFactor, event.clientX, event.clientY);

    if (this.resolutionScaling !== DROPPED_RES) {
      this.resolutionScaling = DROPPED_RES;
      this.setCanvasSize();
    }

    if (this.zoomTimeoutID !== false) {
      clearTimeout(this.zoomTimeoutID);
      this.zoomTimeoutID = 0;
    }
    this.zoomTimeoutID = setTimeout(() => {
      this.resolutionScaling = 1;
      this.setCanvasSize();
      this.setAutoIterations();
      this.zoomTimeoutID = false;
      this.render();
    }, 200);

    this.render();
  }

  autoClicked(checkBox) {
    this.autoSetIter = checkBox.checked;
    if (this.autoSetIter) {
      this.setAutoIterations();
      this.render();
    }
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

// eslint-disable-next-line no-unused-vars
function resetView() {
  renderer.scaling = 1;
  renderer.resetView();
  renderer.resolutionScaling = 1;
  renderer.setCanvasSize();
  renderer.render();
}

// eslint-disable-next-line no-unused-vars
function exportImage() {
  renderer.resolutionScaling = 1;
  renderer.setCanvasSize();
  renderer.render();
  const img = renderer.cnv.toDataURL('image/png');

  const dlLink = document.createElement('a');
  dlLink.download = 'export.png';
  dlLink.href = img;
  dlLink.dataset.downloadurl = ['image/png', dlLink.download, dlLink.href].join(':');

  document.body.appendChild(dlLink);
  dlLink.click();
  document.body.removeChild(dlLink);
}
