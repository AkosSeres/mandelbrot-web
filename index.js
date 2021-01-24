/* eslint-disable no-bitwise */
const cnv = document.getElementById('mainCanvas');
/** @type {WebGLRenderingContext} */
const gl = cnv.getContext('webgl');

const rShader = `
precision highp float;
uniform vec2 resolution;

void iterateMandelbrot(inout float r, inout float i, float startR, float startI);

void main() {
    float unit = min(resolution.x, resolution.y);
    float realStart = (2.0 * gl_FragCoord.x / unit) - 1.5;
    float imStart = -(2.0 * gl_FragCoord.y / unit) + 1.0;
    float real = 0.0;
    float imaginary = 0.0;
    for(int i = 0; i <= 50; i++) { iterateMandelbrot(real, imaginary, realStart, imStart); }

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

// Load vertex shader (only used because it's mandatory)
const vertexShader = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vertexShader, document.getElementById('vShader').firstChild.textContent);
gl.compileShader(vertexShader);
// Load the fragment shader used to render the image
const renderShader = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(renderShader, rShader);
gl.compileShader(renderShader);
if (!gl.getShaderParameter(renderShader, gl.COMPILE_STATUS)) {
  throw new Error(`An error occurred compiling the render shader: ${gl.getShaderInfoLog(renderShader)}`);
}

// Link into program
const shaderProgram = gl.createProgram();
gl.attachShader(shaderProgram, vertexShader);
gl.attachShader(shaderProgram, renderShader);
gl.linkProgram(shaderProgram);
// Check for errors
if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
  throw new Error('Error loading the shaders');
}

// Get locations
const resolutionLocation = gl.getUniformLocation(shaderProgram, 'resolution');

function createVertexBuffer() {
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER,
    new Float32Array([
      -1.0, 1.0,
      1.0, 1.0,
      -1.0, -1.0,
      1.0, -1.0,
    ].map((n) => n)),
    gl.STATIC_DRAW);
  return buffer;
}

// Create buffer of the corner points of the screen
const posBuffer = createVertexBuffer();

function render() {
  gl.clearColor(0.8, 0.8, 0.8, 1.0);
  gl.clearDepth(1.0);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const vertexPos = gl.getAttribLocation(shaderProgram, 'aVertexPosition');
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
  gl.vertexAttribPointer(vertexPos, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vertexPos);

  gl.useProgram(shaderProgram);
  const offset = 0;
  const vertexCount = 4;
  gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);
  gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);
}

function setCanvasSize() {
  gl.canvas.width = window.innerWidth;
  gl.canvas.height = window.innerHeight;
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  render();
}

window.onload = () => { setCanvasSize(); };
window.onresize = () => { setCanvasSize(); };
