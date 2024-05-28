// Shaders
const vsSource = `
attribute vec4 aVertexPosition;
attribute vec4 aVertexColor;
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
varying lowp vec4 vColor;
void main(void) {
    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
    vColor = aVertexColor;
}
`;

const fsSource = `
varying lowp vec4 vColor;
void main(void) {
    gl_FragColor = vColor;
}
`;

function initShaderProgram(gl, vsSource, fsSource) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        console.error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
        return null;
    }

    return shaderProgram;
}

function loadShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

function generate_box(position, size) {
    const [x, y, z] = position;
    const s = size / 2;

    const vertices = [
        -s, -s,  s,  1, 0, 0,
         s, -s,  s,  0, 1, 0,
         s,  s,  s,  0, 0, 1,
        -s,  s,  s,  1, 1, 0,
        -s, -s, -s,  0, 1, 1,
         s, -s, -s,  1, 0, 1,
         s,  s, -s,  1, 1, 1,
        -s,  s, -s,  0, 0, 0,
        -s,  s, -s,  1, 0, 0,
         s,  s, -s,  0, 1, 0,
         s,  s,  s,  0, 0, 1,
        -s,  s,  s,  1, 1, 0,
        -s, -s, -s,  0, 1, 1,
         s, -s, -s,  1, 0, 1,
         s, -s,  s,  1, 1, 1,
        -s, -s,  s,  0, 0, 0,
         s, -s, -s,  1, 0, 0,
         s,  s, -s,  0, 1, 0,
         s,  s,  s,  0, 0, 1,
         s, -s,  s,  1, 1, 0,
        -s, -s, -s,  0, 1, 1,
        -s,  s, -s,  1, 0, 1,
        -s,  s,  s,  1, 1, 1,
        -s, -s,  s,  0, 0, 0
    ];

    const indices = [
         0,  1,  2,  0,  2,  3,
         4,  5,  6,  4,  6,  7,
         8,  9, 10,  8, 10, 11,
        12, 13, 14, 12, 14, 15,
        16, 17, 18, 16, 18, 19,
        20, 21, 22, 20, 22, 23
    ];

    let translatedVertices = [];
    for (let i = 0; i < vertices.length; i += 6) {
        let vertex = vec3.fromValues(vertices[i], vertices[i+1], vertices[i+2]);
        vec3.add(vertex, vertex, vec3.fromValues(x, y, z));
        translatedVertices.push(vertex[0], vertex[1], vertex[2], vertices[i+3], vertices[i+4], vertices[i+5]);
    }

    return {
        vertices: translatedVertices,
        indices: indices
    };
}

function initBuffers(gl, position, size) {
    const { vertices, indices } = generate_box(position, size);

    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    return {
        vertex: vertexBuffer,
        indices: indexBuffer,
        vertexCount: indices.length
    };
}

function drawScene(gl, programInfo, buffers, deltaTime) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const fieldOfView = 45 * Math.PI / 180;
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 100.0;
    const projectionMatrix = mat4.create();

    mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

    const modelViewMatrix = mat4.create();
    mat4.translate(modelViewMatrix, modelViewMatrix, [-0.0, 0.0, -6.0]);

    const rotation = deltaTime * 0.001;
    mat4.rotate(modelViewMatrix, modelViewMatrix, rotation, [0, 0, 1]);
    mat4.rotate(modelViewMatrix, modelViewMatrix, rotation, [0, 1, 0]);

    {
        const numComponents = 3;
        const type = gl.FLOAT;
        const normalize = false;
        const stride = 6 * Float32Array.BYTES_PER_ELEMENT;
        const offset = 0;
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.vertex);
        gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, numComponents, type, normalize, stride, offset);
        gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
    }

    {
        const numComponents = 3;
        const type = gl.FLOAT;
        const normalize = false;
        const stride = 6 * Float32Array.BYTES_PER_ELEMENT;
        const offset = 3 * Float32Array.BYTES_PER_ELEMENT;
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.vertex);
        gl.vertexAttribPointer(programInfo.attribLocations.vertexColor, numComponents, type, normalize, stride, offset);
        gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor);
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);

    gl.useProgram(programInfo.program);

    gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
    gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);

    {
        const vertexCount = buffers.vertexCount;
        const type = gl.UNSIGNED_SHORT;
        const offset = 0;
        gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
    }
}

function main() {
    const canvas = document.getElementById('main-canvas');
    const gl = canvas.getContext('webgl');

    if (!gl) {
        console.error('Unable to initialize WebGL');
        return;
    }

    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
    const programInfo = {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
            vertexColor: gl.getAttribLocation(shaderProgram, 'aVertexColor'),
        },
        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
            modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
        },
    };

    const buffers = initBuffers(gl, [1.0, 1.0, 1.0], 2.0);

    let then = 0;

    function render(now) {
        now *= 0.001;
        const deltaTime = now - then;
        then = now;

        drawScene(gl, programInfo, buffers, deltaTime);

        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}

main();
