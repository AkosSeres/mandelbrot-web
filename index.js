/* eslint-disable no-bitwise */
const cnv = document.getElementById('mainCanvas');
/** @type {WebGLRenderingContext} */
const gl = cnv.getContext('webgl');

const rShader = `
precision highp float;
uniform vec2 resolution;

void main() {
    gl_FragColor = vec4((gl_FragCoord.xy / resolution), 0, 1);
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

// Create buffer of the corner points of the screen
const posBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
gl.bufferData(gl.ARRAY_BUFFER,
  new Float32Array([
    -1.0, 1.0,
    1.0, 1.0,
    -1.0, -1.0,
    1.0, -1.0,
  ].map((n) => n)),
  gl.STATIC_DRAW);

// Then render the image
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
