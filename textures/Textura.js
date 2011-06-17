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
 * @fileoverview Objecte Textura, encarregat de crear la textura buida i carregar les tiles dins
 * 
 * @author redribbon
 */

var Textura = function(gl, zoomInicial) {
    this._cache          = new TileCache();
    this._gl             = gl;
    this._bufferTextures = [];
    this._tamanyTile     = 256; //Per ara predefinit, però depent del proveidor. OSM es 256 
    this._maxIdBuffer    = 4;
    this._tilesCarregar  = 1 << (this._maxIdBuffer-1);   // Predefinim el num max de tiles de la textura.
    this._zoomInicial    = zoomInicial;
    this._buffAct        = Math.min(zoomInicial, this._maxIdBuffer);
    
    this._numTiles = Math.min(1 << zoomInicial, this._tilesCarregar);
    this._tamany = this._tamanyTile * this._numTiles;
    
    this._inicialitzarTextures(); //Creem els maxIdBuffer tamanys de textures
    
    this._buffAnt = 0;
    
    this._imatgeBuida = new Image();
    this._imatgeBuida.src = './textures/mapes/buida.png';
};


// Getters
Textura.prototype.getBuffAct     = function() {return this._buffAct;};
Textura.prototype.getTamany      = function() {return this._tamany;};
Textura.prototype.getTamanyTile  = function() {return this._tamanyTile;};
Textura.prototype.getMaxIdBuffer = function() {return this._maxIdBuffer;};
Textura.prototype.getNumTiles    = function() {return this._numTiles;};

Textura.prototype.getTextura = function(key) {
    if (null == key || 0 == key) {
        return this._bufferTextures[this._buffAct];
    } else if (-1 == key) {
        //return this._bufferTextures[this._buffAnt];
        return this._bufferTextures[this._buffAct];
    }
};

Textura.prototype.canviarBuffer = function(zoom_) {
    if (this._maxIdBuffer > zoom_) {
        this._buffAct = zoom_;
        this._buffAnt = zoom_;
    } else {
        /*var iguales = this._buffAct == this._maxIdBuffer ? true : false;
        if (iguales) {
            var aux = this._buffAct;
            this._buffAct = this._buffAnt;
            this._buffAnt = aux;
        } else {
            this._buffAnt = this._buffAct;
            this._buffAct = this._maxIdBuffer;
        }
        console.log("TEXT: buffAct i ant: "+this._buffAct+","+this._buffAnt+' resatejemTextura');*/
       this._buffAct = this._maxIdBuffer;
    }    
};

Textura.prototype._carregar = function(xOffset, yOffset, tile) {
    try {
        var gl = this._gl;
        gl.bindTexture(gl.TEXTURE_2D, this._bufferTextures[this._buffAct]); 
        gl.texSubImage2D(gl.TEXTURE_2D, 0, xOffset, yOffset, gl.RGBA, gl.UNSIGNED_BYTE, tile.imatge);
        gl.bindTexture(gl.TEXTURE_2D, null);
        controladorEvents.tileCarregada();
    }catch(exep){alert(exep);};
};

Textura.prototype.carregarTile = function(zoom, x, y, xOffset, yOffset) {
    var tile = this._cache.getTile(zoom+"/"+x+"/"+y);
    if (null == tile) {
        var imatge = new Image();
        // Programem l'event de quan s'ha carregat la tile
        dojo.connect(imatge, 'onload', this, function() {
            try {
                var tile = new Tile(zoom, x, y);
                tile.assignarImatge(imatge);
                this._cache.afegirTile(tile.getClau(), tile);
                
                this._carregar(xOffset, yOffset, tile);
            }catch(exep){alert(exep);};
        });
        var tex = this;
        // Programem l'event en cas d'error al carregar la tile
        dojo.connect(imatge, 'onerror', this, function(){
            console.log("TEXTURA: Error al cargar la tile. Volvemos a intentar!");
            tex.carregarTile(zoom, x, y, xOffset, yOffset);
        });
        
        var arrayDir = ['a', 'b', 'c'];
        var index = Math.floor(Math.random()*3);
        var url = 'http://' + arrayDir[index] + '.tile.openstreetmap.org/'+ zoom + '/'+ x + '/' + y + '.png';

        imatge.src = url;
        
    } else {
       this._carregar(xOffset, yOffset, tile);
    }
};

Textura.prototype.carregarTotesLesTiles = function(zoom) {
    var numTiles = 1 << zoom;
    var xIni     = Math.floor(numTiles/2);
    for(var y = 0; y < numTiles; y++){
        for (var x = 0; x < numTiles; x++) {
            var xAct = xIni + x;
            xAct = xAct >= numTiles ? xAct - numTiles : xAct;
            this.carregarTile(zoom, xAct, y, xAct * this._tamanyTile, (numTiles-1 - y) * this._tamanyTile);
        }
    }
};

Textura.prototype._crearTextura = function(zoom_) {
    var numTiles, idBuff, tamany;
    
    if (zoom_ >= this._maxIdBuffer) {
        numTiles = this._tilesCarregar;
        idBuff   = this._maxIdBuffer;
    } else {
        numTiles = 1 << zoom_;
        idBuff   = zoom_;
    }
    
    tamany = this._tamanyTile * numTiles;

    // Creem la textura buida per poder asignar les imatges més tard, asignan només las que necesitem
    gl.bindTexture(gl.TEXTURE_2D, this._bufferTextures[idBuff]);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, tamany, tamany, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.bindTexture(gl.TEXTURE_2D, null);
};

Textura.prototype._inicialitzarTextures = function() {
    for(var i = 0; i <= this._maxIdBuffer; i++) {
        this._bufferTextures[i] = gl.createTexture();
        this._crearTextura(i);
    }
};

Textura.prototype._resetejarText = function(idBuff) {
    try {
        var gl = this._gl;
        gl.bindTexture(gl.TEXTURE_2D, this._bufferTextures[idBuff]);
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, this._imatgeBuida);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }catch(exep){alert(exep);};
}
