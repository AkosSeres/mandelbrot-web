!function(){const t=.5;class e{constructor(t){this.cnv=document.getElementById(t),this.gl=this.cnv.getContext("webgl",{alpha:!1,desynchronized:!0,antialias:!1,preserveDrawingBuffer:!1}),this.scaling=1,this.offsetX=0,this.offsetY=0,this.iterations=20,this.autoSetIter=!0,this.normalisedRendering=!0,this.greyscaleColors=!1,document.getElementById("smoothCheckbox").checked=this.normalisedRendering,document.getElementById("autoCheckbox").checked=this.autoSetIter,document.getElementById("greyscaleCheckbox").checked=this.greyscaleColors,this.resolutionScaling=1,this.compileProgram(),this.posBuffer=this.createVertexBuffer(),this.setCanvasSize(),this.resetView(),window.onresize=()=>{this.setCanvasSize(),this.render()},this.cnv.addEventListener("wheel",this.handleScroll.bind(this)),this.cnv.addEventListener("mousedown",this.handleMouseDown.bind(this)),this.cnv.addEventListener("mouseup",this.handleMouseUp.bind(this)),this.cnv.addEventListener("mousemove",this.handleMouseMove.bind(this)),this.cnv.addEventListener("touchstart",this.handleTouchStart.bind(this)),this.cnv.addEventListener("touchend",this.handleTouchEnd.bind(this)),this.cnv.addEventListener("touchmove",this.handleTouchMove.bind(this)),this.mouseIsDown=!1,this.touchIDs=[],this.touchCoords=[]}render(){this.gl.clearColor(.8,.8,.8,1),this.gl.clearDepth(1),this.gl.enable(this.gl.DEPTH_TEST),this.gl.depthFunc(this.gl.LEQUAL),this.gl.clear(this.gl.COLOR_BUFFER_BIT|this.gl.DEPTH_BUFFER_BIT);const t=this.gl.getAttribLocation(this.shaderProgram,"aVertexPosition");this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.posBuffer),this.gl.vertexAttribPointer(t,2,this.gl.FLOAT,!1,0,0),this.gl.enableVertexAttribArray(t),this.gl.useProgram(this.shaderProgram),this.gl.uniform2f(this.resolutionLocation,this.gl.canvas.width,this.gl.canvas.height),this.gl.uniform1f(this.scalingLocation,this.scaling),this.gl.uniform2f(this.offsetsLocation,this.offsetX,this.offsetY),this.gl.drawArrays(this.gl.TRIANGLE_STRIP,0,4)}compileProgram(){if(this.vertexShader=this.gl.createShader(this.gl.VERTEX_SHADER),this.gl.shaderSource(this.vertexShader,document.getElementById("vShader").firstChild.textContent),this.gl.compileShader(this.vertexShader),this.renderShader=this.gl.createShader(this.gl.FRAGMENT_SHADER),this.gl.shaderSource(this.renderShader,e.renderShaderSrc(this.iterations,this.greyscaleColors,this.normalisedRendering)),this.gl.compileShader(this.renderShader),!this.gl.getShaderParameter(this.renderShader,this.gl.COMPILE_STATUS))throw new Error(`An error occurred compiling the render shader: ${this.gl.getShaderInfoLog(this.renderShader)}`);if(this.shaderProgram=this.gl.createProgram(),this.gl.attachShader(this.shaderProgram,this.vertexShader),this.gl.attachShader(this.shaderProgram,this.renderShader),this.gl.linkProgram(this.shaderProgram),!this.gl.getProgramParameter(this.shaderProgram,this.gl.LINK_STATUS))throw new Error("Error loading the shaders");this.resolutionLocation=this.gl.getUniformLocation(this.shaderProgram,"resolution"),this.scalingLocation=this.gl.getUniformLocation(this.shaderProgram,"scaling"),this.offsetsLocation=this.gl.getUniformLocation(this.shaderProgram,"offsets"),document.getElementById("iterInput").value=this.iterations.toFixed()}iterationsChanged(t){let e=Math.floor(t.valueAsNumber);e<Number.parseInt(t.min)&&(e=Number.parseInt(t.min)),e>Number.parseInt(t.max)&&(e=Number.parseInt(t.max)),this.iterations=e,this.compileProgram(),this.render()}setCanvasSize(){let e=window.devicePixelRatio||1;this.resolutionScaling==t&&this.normalisedRendering&&(e*=.5),e*=this.resolutionScaling,this.gl.canvas.width=window.innerWidth*e,this.gl.canvas.height=window.innerHeight*e,this.gl.viewport(0,0,this.gl.canvas.width,this.gl.canvas.height)}resetView(){const t=this.gl.canvas.width/1.3,e=this.gl.canvas.height/1.1,i=Math.min(t,e);t>=e?(this.offsetX=-(t-e)/i,this.offsetY=0):(this.offsetY=-(e-t)/i,this.offsetX=0)}createVertexBuffer(){const t=this.gl.createBuffer();return this.gl.bindBuffer(this.gl.ARRAY_BUFFER,t),this.gl.bufferData(this.gl.ARRAY_BUFFER,new Float32Array([-1,1,1,1,-1,-1,1,-1].map((t=>t))),this.gl.STATIC_DRAW),t}toComplexSpace(t,e){const i={r:0,i:0};let s=window.devicePixelRatio||1;s*=this.resolutionScaling;const o=this.gl.canvas.width/1.3,n=this.gl.canvas.height/1.1,r=Math.min(o,n),h=t*s,a=e*s;return i.r=(2*h/r-2)/this.scaling+this.offsetX,i.i=(-2*a/r+1.1)/this.scaling-this.offsetY,i}scaleAround(t,e,i){const s=this.scaling*t;let o=window.devicePixelRatio||1;o*=this.resolutionScaling;const n=this.gl.canvas.width/1.3,r=this.gl.canvas.height/1.1,h=Math.min(r,n),a=e*o,l=i*o;this.offsetX=(2*a/h-2)*(1/this.scaling-1/s)+this.offsetX,this.offsetY=-(-2*l/h+1.1)*(1/s-1/this.scaling)+this.offsetY,this.scaling=s}handleMouseDown(e){e.preventDefault(),this.mouseIsDown=!0,this.resolutionScaling=t,this.setCanvasSize()}handleMouseUp(t){t.preventDefault(),this.mouseIsDown=!1,this.resolutionScaling=1,this.setCanvasSize(),this.render()}handleTouchStart(e){return this.mouseIsDown=!0,e.preventDefault(),e.touches.length>1?(2===e.touches.length&&(this.touchIDs=[],this.touchCoords=[],this.touchIDs.push(e.touches[0].identifier),this.touchIDs.push(e.touches[1].identifier),this.touchCoords.push({x:e.touches[0].clientX,y:e.touches[0].clientY}),this.touchCoords.push({x:e.touches[1].clientX,y:e.touches[1].clientY})),e.touches.length>2&&(this.touchIDs=[],this.touchCoords=[]),!1):(1===e.touches.length&&(this.touchIDs=[e.touches[0].identifier],this.touchCoords=[{x:e.touches[0].clientX,y:e.touches[0].clientY}],this.mouseIsDown=!0,this.resolutionScaling=t,this.setCanvasSize()),!1)}handleTouchEnd(t){return t.preventDefault(),t.touches.length>1?(2===t.touches.length&&(this.touchIDs=[],this.touchCoords=[],this.touchIDs.push(t.touches[0].identifier),this.touchIDs.push(t.touches[1].identifier),this.touchCoords.push({x:t.touches[0].clientX,y:t.touches[0].clientY}),this.touchCoords.push({x:t.touches[1].clientX,y:t.touches[1].clientY})),t.touches.length>2&&(this.touchIDs=[],this.touchCoords=[]),!1):(1===t.touches.length&&(this.touchIDs=[t.touches[0].identifier],this.touchCoords=[{x:t.touches[0].clientX,y:t.touches[0].clientY}]),0===t.touches.length&&(this.touchIDs=[],this.touchCoords=[],this.mouseIsDown=!1,this.resolutionScaling=1,this.setCanvasSize(),this.setAutoIterations(),this.render()),this.mouseIsDown=!1,!1)}setAutoIterations(){this.autoSetIter&&(this.iterations=this.scaling**.25*20,this.compileProgram())}handleTouchMove(t){if(t.preventDefault(),2===t.touches.length){let e=[];return t.touches.item(0).identifier===this.touchIDs[0]?(e.push(t.touches.item(0)),e.push(t.touches.item(1))):(e.push(t.touches.item(1)),e.push(t.touches.item(0))),e=e.map((t=>({x:t.clientX,y:t.clientY}))),this.processMultiTouchGesture(this.touchCoords,e),this.touchCoords=e,!1}if(t.touches.length>2)return!1;const e=t.touches[0].clientX-this.touchCoords[0].x,i=t.touches[0].clientY-this.touchCoords[0].y,s=this.toComplexSpace(0,0),o=this.toComplexSpace(e,i);return this.offsetX+=s.r-o.r,this.offsetY+=s.i-o.i,this.render(),this.touchIDs=[t.touches[0].identifier],this.touchCoords=[{x:t.touches[0].clientX,y:t.touches[0].clientY}],!1}processMultiTouchGesture(t,e){const i={x:t[1].x+t[0].x,y:t[1].y+t[0].y};i.x*=.5,i.y*=.5;const s={x:e[1].x+e[0].x,y:e[1].y+e[0].y};s.x*=.5,s.y*=.5;const o=((t[0].x-t[1].x)**2+(t[0].y-t[1].y)**2)**.5,n=((e[0].x-e[1].x)**2+(e[0].y-e[1].y)**2)**.5,r=Math.sqrt(n/o),h={x:i.x+s.x,y:i.y+s.y};h.x*=.5,h.y*=.5;const a={x:s.x-i.x,y:s.y-i.y};a.x*=r,a.y*=r,this.scaleAround(r,h.x,h.y);const l=this.toComplexSpace(0,0),c=this.toComplexSpace(a.x,a.y);this.offsetX+=l.r-c.r,this.offsetY+=l.i-c.i,this.render()}handleMouseMove(t){if(t.preventDefault(),!this.mouseIsDown)return;const e=this.toComplexSpace(0,0),i=this.toComplexSpace(t.movementX,t.movementY);this.offsetX+=e.r-i.r,this.offsetY+=e.i-i.i,this.render()}handleScroll(e){e.preventDefault();const i=1.001**-e.deltaY;this.scaleAround(i,e.clientX,e.clientY),this.resolutionScaling!==t&&(this.resolutionScaling=t,this.setCanvasSize()),!1!==this.zoomTimeoutID&&(clearTimeout(this.zoomTimeoutID),this.zoomTimeoutID=0),this.zoomTimeoutID=setTimeout((()=>{this.resolutionScaling=1,this.setCanvasSize(),this.setAutoIterations(),this.zoomTimeoutID=!1,this.render()}),300),this.render()}autoClicked(t){this.autoSetIter=t.checked,this.autoSetIter&&(this.setAutoIterations(),this.render())}smoothClicked(t){this.normalisedRendering=t.checked,this.compileProgram(),this.render()}greyscaleClicked(t){this.greyscaleColors=t.checked,this.compileProgram(),this.render()}static renderShaderSrc(t,e=!1,i=!1){return i?`\n    precision highp float;\n    uniform vec2 resolution;\n    uniform float scaling;\n    uniform vec2 offsets;\n    \n    void iterateMandelbrot(inout float r, inout float i, float startR, float startI);\n    vec3 huetorgb(in float hue);\n    \n    void main() {\n        float unit = min(resolution.x / 1.3, resolution.y / 1.1);\n        float realStart = ((2.0 * gl_FragCoord.x / unit) - 2.0) / scaling + offsets.x;\n        float imStart = (-(2.0 * gl_FragCoord.y / unit) + 1.1) / scaling - offsets.y;\n        float real = 0.0;\n        float imaginary = 0.0;\n        const int maxIter = ${Math.round(t)} * 5;\n        int iter;\n        for(int i = 0;i <= maxIter;i++) {\n          iterateMandelbrot(real, imaginary, realStart, imStart);\n          iter = i;\n          if((real * real + imaginary * imaginary) > 5.0) {\n            break;\n          }\n        }\n    \n        float absSq = float(iter) / float(maxIter);\n        ${e?"\n              if(iter == maxIter) absSq = 0.0;\n              absSq = sqrt(absSq);\n              gl_FragColor = vec4(absSq, absSq, absSq, 1.0);\n              ":"\n              if(iter == maxIter) {\n                gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);\n              }\n              else {\n                vec3 color = huetorgb(absSq * 15.0);\n                gl_FragColor = vec4(color, 1.0);\n              }\n              "}\n    }\n    \n    void iterateMandelbrot(inout float r, inout float i, float startR, float startI){\n        float oldR = r;\n        r = r * r - i * i + startR;\n        i = 2.0 * oldR * i + startI;\n    }\n\n    // Function to convert a hue value to rgb with 1.0 saturation and 0.0 brightness\n    // Implemented based on a wikipedia article\n    vec3 huetorgb(in float hue){\n      float k5 = mod(5.0 + hue, 6.0);\n      float k3 = mod(3.0 + hue, 6.0);\n      float k1 = mod(1.0 + hue, 6.0);\n      float f5 = 1.0 - max(0.0, min(min(k5, 4.0 - k5), 1.0));\n      float f3 = 1.0 - max(0.0, min(min(k3, 4.0 - k3), 1.0));\n      float f1 = 1.0 - max(0.0, min(min(k1, 4.0 - k1), 1.0));\n      return vec3(f5, f3, f1);\n    }\n    `:`\n      precision highp float;\n      uniform vec2 resolution;\n      uniform float scaling;\n      uniform vec2 offsets;\n      \n      void iterateMandelbrot(inout float r, inout float i, float startR, float startI);\n      vec3 huetorgb(in float hue);\n      \n      void main() {\n          float unit = min(resolution.x / 1.3, resolution.y / 1.1);\n          float realStart = ((2.0 * gl_FragCoord.x / unit) - 2.0) / scaling + offsets.x;\n          float imStart = (-(2.0 * gl_FragCoord.y / unit) + 1.1) / scaling - offsets.y;\n          float real = 0.0;\n          float imaginary = 0.0;\n          for(int i = 0;i < ${Math.round(t)};i++) iterateMandelbrot(real, imaginary, realStart, imStart);\n      \n          float absSq = real * real + imaginary * imaginary;\n          ${e?"\n                float brightness = absSq;\n                if(absSq < 10.0){\n                    brightness = 1.0;\n                }else{\n                    brightness = fract(absSq);\n                }\n                gl_FragColor = vec4(brightness, brightness, brightness, 1.0);\n                ":`\n                vec3 color = huetorgb(absSq * 400.0 / ${t.toFixed(2)});\n                float mult = 1.0;\n                if(color == vec3(1.0, 1.0, 1.0)) mult = 0.0;\n                gl_FragColor = vec4(mult * color, 1.0);\n                `}\n      }\n      \n      void iterateMandelbrot(inout float r, inout float i, float startR, float startI){\n          float oldR = r;\n          r = r * r - i * i + startR;\n          i = 2.0 * oldR * i + startI;\n      }\n\n      // Function to convert a hue value to rgb with 1.0 saturation and 0.0 brightness\n      // Implemented based on a wikipedia article\n      vec3 huetorgb(in float hue){\n        float k5 = mod(5.0 + hue, 6.0);\n        float k3 = mod(3.0 + hue, 6.0);\n        float k1 = mod(1.0 + hue, 6.0);\n        float f5 = 1.0 - max(0.0, min(min(k5, 4.0 - k5), 1.0));\n        float f3 = 1.0 - max(0.0, min(min(k3, 4.0 - k3), 1.0));\n        float f1 = 1.0 - max(0.0, min(min(k1, 4.0 - k1), 1.0));\n        return vec3(f5, f3, f1);\n      }\n      `}}const i=new e("mainCanvas");i.render(),document.getElementById("autoCheckbox").onclick=function(){i.autoClicked(this)},document.getElementById("smoothCheckbox").onclick=function(){i.smoothClicked(this)},document.getElementById("greyscaleCheckbox").onclick=function(){i.greyscaleClicked(this)},document.getElementById("iterInput").onchange=function(){i.iterationsChanged(this)},document.getElementById("resetButton").onclick=()=>{i.scaling=1,i.resetView(),i.setAutoIterations(),i.resolutionScaling=1,i.setCanvasSize(),i.render()},document.getElementById("exportButton").onclick=()=>{!function(){i.resolutionScaling=1,i.setCanvasSize(),i.render();const t=i.cnv.toDataURL("image/png"),e=document.createElement("a");e.download="export.png",e.href=t,e.dataset.downloadurl=["image/png",e.download,e.href].join(":"),document.body.appendChild(e),e.click(),document.body.removeChild(e)}()}}();