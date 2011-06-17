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
 * @fileoverview Classe Esfera: Encarregada de calcular les coordenades dels vértex visibles,
 * així com les coordenades dins la textura.
 * 
 * @author redribbon
 */

var Esfera = function(gl, zoomInicial) {
    this._gl = gl;
    this._radius = 100;
    this._zoom  = null;
    
    this._bufferVertex;
    this._bufferIndex;
    this._bufferNormal;
    this._bufferTextura;
    
    this._tileXAct           = null;
    this._tileYAct           = null;
    this._numTilesMapaAct    = null; // Indica el total de tiles depenent del zoom
    this._numTilesCarregades = null; // Indica les tiles carregades a la textura. En cas que sigui igual que l'anterior, no actualitcis tiles!
    
    this._textura = new Textura(gl, zoomInicial);
    
    this.actualitzar(undefined, zoomInicial);
};

Esfera.prototype.actualitzar = function(cam_, zoom_) {
    var zoom;
    if (undefined != cam_) {
        zoom = cam_.calcZoom();
    }
    if (undefined != zoom_) {
        zoom = zoom_;
    }
    if (4 > zoom) {
        this._actualitzarMenor(cam_, zoom);
    } else {
        this._actualitzarMajor(cam_);
    }
};
 
Esfera.prototype._actualitzarMajor = function(cam_, zoom_) {
    var debug = true;
    
    var vertexs  = [];
    var textures = [];
    var indexs   = [];
    
    var lat, lon;
    var zoom;
    
    if (undefined == cam_) {
        lat = 0;
        lon = 0;
        zoom = this._zoom; 
    } else {
        lat = cam_.getLat();
        lon = cam_.getLon();
        zoom = cam_.calcZoom();
    }

    if (undefined != zoom_) zoom = zoom_;
    
    this._textura.canviarBuffer(3);
    if (this._zoom != zoom) {
        this._textura._resetejarText(3);
    }
    // Calculem la tile actual que mira la camera
    var xTile = Utils.lon2tile(lon, zoom);
    var yTile = Utils.lat2tile(lat, zoom);
    // Si estem a la mateixa tile que la última vegada no actualitzem
    if(xTile != this._tileXAct || yTile != this._tileYAct || zoom != this._zoom) {
        this._tileXAct = xTile;
        this._tileYAct = yTile;
        this._zoom     = zoom;
        
        var tamanyTile = this._textura.getTamanyTile();
        
        var tilesZoom = 1 << zoom;
        
        this._numTilesMapaAct = tilesZoom;
        
        var numTiles = Math.min(tilesZoom, (1 << this._textura.getBuffAct()));
        var meitatTiles = Math.floor(numTiles / 2);

        // Calculem la tile inicial, la de dalt a l'esquerra
        var xIni = xTile - meitatTiles;
        xIni = xIni < 0 ? tilesZoom + xIni : xIni;
        
        var yIni = yTile - meitatTiles;
        yIni = yIni < 0 ? 0 : yIni;
        
        // Recorrem la graella de numTiles x numTiles, creant els vertex
        for (var y = 0; y <= numTiles; y++) {
            var yTileAct = yIni + y;
            yTileAct = yTileAct >= tilesZoom ? yTileAct - tilesZoom : yTileAct;
            
            // Calculem la latitud del vertex
            var latVertex = Utils.tile2lat(yTileAct, zoom);
            var latRad    = latVertex * Math.PI / 180;
            
            var sinLat    = Math.sin(latRad);
            var cosLat    = Math.cos(latRad);

            var v = 1- (y / numTiles);
    
            for (var x = 0; x <= numTiles; x++) {
                var xTileAct = xIni + x;
                xTileAct = xTileAct >= tilesZoom ? xTileAct - tilesZoom : xTileAct;
                
                // Calculem la longitud del vertex
                var lonVertex = Utils.tile2lon(xTileAct, zoom);
                var lonRad    = lonVertex * Math.PI / 180;
                
                var sinLon = Math.sin(lonRad);
                var cosLon = Math.cos(lonRad);
    
                var xCoord = sinLon * cosLat;
                var yCoord = sinLat;
                var zCoord = cosLon * cosLat;
                
                var u =  (x / numTiles);
    
                textures.push(u);
                textures.push(v);
                
                vertexs.push(this._radius * xCoord);
                vertexs.push(this._radius * yCoord);
                vertexs.push(this._radius * zCoord);
                
                if (x < numTiles && y < numTiles) {
                    this._textura.carregarTile(zoom, xTileAct, yTileAct, x * tamanyTile, (numTiles-1 - y) * tamanyTile);
                    this._numTilesCarregades++;
                }
            }
        }
        indexs = this._carregarIndexs(numTiles);
        this._asignarCoords(vertexs, textures, indexs);
    }
};

Esfera.prototype._actualitzarMenor = function(cam_, zoom_) {
    zoom_ = Math.min(zoom_, 3);
    if (this._zoom != zoom_) {
        this._textura.canviarBuffer(zoom_);
        this._zoom = zoom_;
        var radius = this._radius;
        var latitudeBands = 30;
        var longitudeBands = 30;
        var vertexs  = [];
        var textures = [];
        
        for (var latNumber = 0; latNumber <= latitudeBands; latNumber++) {
          var theta = latNumber * Math.PI / latitudeBands;
          var sinTheta = Math.sin(theta);
          var cosTheta = Math.cos(theta);
          
          var latRad    = Math.PI / 2 - ((latNumber/latitudeBands) * Math.PI);
          var reproject  =  Math.log(Math.tan(latRad) + (1/Math.cos(latRad)));
          var v = 1 - (1 - (reproject / Math.PI)) / 2;
    
          for (var longNumber = 0; longNumber <= longitudeBands; longNumber++) {
            var phi = longNumber * 2 * Math.PI / longitudeBands;
            phi -= (Math.PI / 2);
            var sinPhi = Math.sin(phi);
            var cosPhi = Math.cos(phi);
    
            var x = cosPhi * sinTheta;
            var y = cosTheta;
            var z = sinPhi * sinTheta;
            var u = 1 - (longNumber / longitudeBands);
    
            textures.push(u);
            textures.push(v);
            vertexs.push(radius * x);
            vertexs.push(radius * y);
            vertexs.push(radius * z);
          }
        }
        
        indexs = this._carregarIndexs(latitudeBands);
        this._asignarCoords(vertexs, textures, indexs);
        this._textura.carregarTotesLesTiles(zoom_);
    }
};

Esfera.prototype._asignarCoords = function(vertexs, textures, indexs) {
    var gl = this._gl;
    
    this._bufferVertex = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this._bufferVertex);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexs), gl.STATIC_DRAW);
    this._bufferVertex.itemSize = 3;
    this._bufferVertex.numItems = vertexs.length / 3;

    this._bufferTextura = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this._bufferTextura);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textures), gl.STATIC_DRAW);
    this._bufferTextura.itemSize = 2;
    this._bufferTextura.numItems = textures.length / 2;
    
    this._bufferIndex = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._bufferIndex);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexs), gl.STATIC_DRAW);
    this._bufferIndex.itemSize = 1;
    this._bufferIndex.numItems = indexs.length;
};

Esfera.prototype._carregarIndexs = function(valorFinal) {
    var indexs = [];
    // Carreguem els index dels vértex
    for (var y = 0; y < valorFinal; y++) {
      for (var x = 0; x < valorFinal; x++) {        
        var first = (y * (valorFinal + 1)) + x;
        var second = first + valorFinal + 1;
        indexs.push(first);
        indexs.push(second);
        indexs.push(first + 1);

        indexs.push(second);
        indexs.push(second + 1);
        indexs.push(first + 1);
      }
    }
    return indexs;
};

// Getters
Esfera.prototype.getBufferIndex    = function() { return this._bufferIndex;   };
Esfera.prototype.getBufferNormal   = function() { return this._bufferNormal;  };
Esfera.prototype.getBufferTextura  = function() { return this._bufferTextura; };
Esfera.prototype.getBufferVertex   = function() { return this._bufferVertex;  };
Esfera.prototype.getObjecteTextura = function() { return this._textura;       };
Esfera.prototype.getZoom           = function() { return this._zoom;          };
