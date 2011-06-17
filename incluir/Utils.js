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
 * @fileoverview Llibrería de funcions útils
 * @author redribbon
 */

var Utils = {};

/**
 * Crea el vector direcció passades unes coordenades de la pantalla
 * 
 */
Utils.gluUnProject = function(winX, winY, winZ, 
                                         modelViewMatrix, projectionMatrix,
                                         viewPort, objPos) {
  var transformMatrix = mat4.create();
  mat4.multiply(projectionMatrix, modelViewMatrix, transformMatrix);
  mat4.inverse(transformMatrix);

  var inVector = [
    (winX - viewPort[0]) / viewPort[2] * 2.0 - 1.0,
    -1 * ((winY - viewPort[1]) / viewPort[3] * 2.0 - 1.0),
    2.0 * winZ - 1.0,
    1.0 ];

  var resultVec4 = [0, 0, 0, 0];
  mat4.multiplyVec4(transformMatrix, inVector, resultVec4);

  if (resultVec4[3] == 0.0) {
    return false;
  }

  resultVec4[3] = 1.0 / resultVec4[3];

  objPos[0] = resultVec4[0] * resultVec4[3];
  objPos[1] = resultVec4[1] * resultVec4[3];
  objPos[2] = resultVec4[2] * resultVec4[3];

  return true;
};

/**
 * Obtenim el num de tile horitzontal a traves de la longitud
 * @param lat   number   Longitud en graus
 * @param zoom  number   Zoom actual de la càmera
 * @return      number   El número de tile horitzontal 
 */
Utils.lon2tile = function(lon,zoom) { 
    return (Math.floor((lon+180)/360*Math.pow(2,zoom))); 
};

/**
 * Obtenim el num de tile vertical a traves de la latitud
 * @param lat   number   Latitud en graus
 * @param zoom  number   Zoom actual de la càmera
 * @return      number   El número de tile vertical 
 */
Utils.lat2tile  = function(lat,zoom) { 
    return (Math.floor((1-Math.log(Math.tan(lat*Math.PI/180) + 1/Math.cos(lat*Math.PI/180))/Math.PI)/2 *Math.pow(2,zoom))); 
};


/**
 * Obtenim la longitud d'una determinada tile
 * @param xtile  number   Numero de tile horitzontal
 * @param zoom   number   Valor del zoom
 * @return       number   Longitud en graus de la tile passada
 */
Utils.tile2lon = function(xtile, zoom) {
    return (xtile / Math.pow(2, zoom) * 360 - 180);
};

/**
 * Obtenim la latitud d'una determinada tile
 * @param ytile  number   Numero de tile vertical
 * @param zoom   number   Valor del zoom
 * @return       number   Latitud en graus de la tile passada
 */
Utils.tile2lat = function(ytile, zoom) {
    var n = Math.PI - 2 * Math.PI * ytile / Math.pow(2, zoom);
    return (180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))));
};