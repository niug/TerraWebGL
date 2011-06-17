/*
 *  Copyrigth (C) 2011 RedRibbon (info@terrawebgl.freehostia.com)
 *  This file is part of TerraWebGL.
 *
 *  TerraWebGL is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  TerraWebGL is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with TerraWebGL.  If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * @fileoverview Objecte que dibuixarà l'escena. Obtenint les característiques de la càmera,
 * i els búffers de dades del objecte a modelar.
 * 
 * @author redribbon
 */
var Escena = function(gl, canvas) {
    
    this._canvas   = canvas;
    this._gl       = gl;
    this._cam      = new Camera(this.getAmple(), this.getAlt());
    
    this._mapa     = new Esfera(gl, 1);
    
    this._punt    = [0, 0, 100];
    this._dibPunt = 0;
    
    this.ALT   = gl.viewportWidth;
    this.AMPLE = gl.viewportHeight;
    this.resize();
    // Inicialitzem la classe global que gestionarà els events
    controladorEvents = new Controls(this, this._cam, this._mapa, canvas);
};

Escena.prototype.setZoom = function(zoom) { 
    var c = this._cam.getPosicio();
    this._mapa.actualitzar(this._cam, zoom);
    this.dibuixarEscena();
}

Escena.prototype.dibuixarEscena = function() {
    var gl = this._gl;
    gl.viewport(0, 0, this.AMPLE, this.ALT);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.001, 6000.0, pMatrix);
    
    mat4.identity(mvMatrix);
    mvMatrix = this._cam.getMvMatriu();

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this._mapa.getObjecteTextura().getTextura(-1));
    gl.uniform1i(shaderProgram.samplerUniform, 0);
    
    /*gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this._mapa.getObjecteTextura().getTextura(0));
    gl.uniform1i(shaderProgram.samplerUniform, 1);*/

    gl.bindBuffer(gl.ARRAY_BUFFER, this._mapa.getBufferTextura());
    gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, this._mapa.getBufferTextura().itemSize, gl.FLOAT, false, 0, 0);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this._mapa.getBufferVertex());
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this._mapa.getBufferVertex().itemSize, gl.FLOAT, false, 0, 0);
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._mapa.getBufferIndex());
    
    setMatrixUniforms();
    gl.drawElements(gl.TRIANGLES, this._mapa.getBufferIndex().numItems, gl.UNSIGNED_SHORT, 0);
    
    if(this._dibPunt==1){
        posicionesPunto = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, posicionesPunto);
        vertices = [
            this._punt[0]+25, this._punt[1]-25, this._punt[2],
            this._punt[0]-25, this._punt[1]-25, this._punt[2],
            this._punt[0]+25, this._punt[1]+25, this._punt[2],
            this._punt[0]-25, this._punt[1]+25, this._punt[2]
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        posicionesPunto.itemSize = 3;
        posicionesPunto.numItems = 4;
        gl.bindBuffer(gl.ARRAY_BUFFER, posicionesPunto);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, posicionesPunto.itemSize, gl.FLOAT, false, 0, 0);
        setMatrixUniforms();
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, posicionesPunto.numItems);
    }
};

// GETTERS
Escena.prototype.getAlt    = function() { return this._gl.viewportHeight;};
Escena.prototype.getAmple  = function() { return this._gl.viewportWidth; };
Escena.prototype.getAspect = function() { return this.getAmple() / this.getAlt();};

Escena.prototype.setPunt = function(punt){ this._punt = punt;};

Escena.prototype.resize = function() {
    this._canvas.width  = this._canvas.clientWidth;
    this._canvas.height = this._canvas.clientHeight;
    this._gl.viewportWidth  = this._canvas.width;
    this._gl.viewportHeight = this._canvas.height;
    this.AMPLE = this._canvas.clientWidth;
    this.ALT   = this._canvas.clientHeight;
    this.dibuixarEscena();
};

