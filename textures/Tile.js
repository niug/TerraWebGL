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
 * @fileoverview Objecte Tile. Conté els atributs necesaris per identificar una tile,
 * així com la imatge en qüestió.
 * 
 * @author redribbon
 */
var Tile = function(zoom, x, y) {
    this._x    = x;
    this._y    = y;
    this._zoom = zoom;
    this._estat = 0; //0->Preparant, 1->Carregant, 2->Carregada, -1->Error
    
    this.imatge = null; 
};

Tile.prototype.obtenirClau = function() {
    return this._zoom+"/"+x+"/"+y;
}

Tile.prototype.assignarImatge = function(imatge) {
    this.imatge = imatge;
};

Tile.prototype.carregarImatge = function(url) {
    this.imatge     = new Image();
    this.imatge.src = url;
};

Tile.prototype.comparar = function(t1) {
    return this._zoom == t1.getZoom() && this._x == t1.getX() && this._y == t1.getY();
};

// Getters
Tile.prototype.getClau = function() { return this._zoom + "/" + this._x + "/" + this._y;};
Tile.prototype.getX    = function() { return this._x;};
Tile.prototype.getY    = function() { return this._y;};
Tile.prototype.getZoom = function() { return this._zoom;};
