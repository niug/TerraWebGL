function initShaders(gl) {
    var fragmentShader = getShader(gl, getShaderFragment(), "x-shader/x-fragment");
    var vertexShader = getShader(gl, getShaderVertex(), "x-shader/x-vertex");

    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      alert("Could not initialise shaders");
    }

    gl.useProgram(shaderProgram);

    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

    shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
    gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);

    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
    shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");
    
    return shaderProgram;
  }

  function getShader(gl, shaderScript, shaderScriptType) {

    if (!shaderScript) {
      return null;
    }

    var shader;
    if (shaderScriptType == "x-shader/x-fragment") {
      shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScriptType == "x-shader/x-vertex") {
      shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
      return null;
    }

    gl.shaderSource(shader, shaderScript);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
      return null;
    }

    return shader;
  }

function getShaderFragment() {
    return "#ifdef GL_ES\nprecision highp float;\n#endif\nvarying vec2 vTextureCoord;varying vec3 vLightWeighting;uniform sampler2D uSampler;void main(void) {vec4 textureColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));gl_FragColor = vec4(textureColor.rgb * vLightWeighting,textureColor.a);}";
}

function getShaderVertex() {
    return "attribute vec3 aVertexPosition;attribute vec3 aVertexNormal;attribute vec2 aTextureCoord;uniform mat4 uMVMatrix;uniform mat4 uPMatrix;varying vec2 vTextureCoord;varying vec3 vLightWeighting;void main(void) {gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);vTextureCoord = aTextureCoord;vLightWeighting = vec3(1.0, 1.0, 1.0);}";
}
