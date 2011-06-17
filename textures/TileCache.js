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
 * @fileoverview Objecte per guardar en memòria temporal les tiles ja visitades
 * 
 * @author redribbon
 */
var TileCache = function() {
    
    this._numTiles = 512; // Predefinim
    
    this._cache = []; 
    this._tamanyAct = 0;
}

TileCache.prototype.afegirTile = function(clau, tile) {
    // TODO: Comprobar que no se sobrepassi el límit de tiles (this._numTiles)
    if (null == this._cache[clau]) {
        this._cache[clau] = tile;
        this._tamanyAct++;
    }
};

TileCache.prototype.getTile = function(clauTile) {
    return this._cache[clauTile];
};

