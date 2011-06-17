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
 * @fileoverview Objecte que representa la càmera.
 * Conté els atributs necesaris per poder emmagatzemar les dades necesaries
 * com la posició, el punt de mira, els eixos de coordenades,...
 * 
 * @author redribbon
 */

var Camera = function(ample, alt) {
    
    this._posicio      = vec3.create([0.0, 0.0, 350.0]);
    this._puntMira     = vec3.create([0.0, 0.0, 0.0]);
    this._sistemaCoord = mat3.create();
    mat3.identity(this._sistemaCoord);
    
    this._zoom = 3;
    this._distMax = 350;
    
    this._puntInter = vec3.create([0,0,0]);
    
    this._ample  = ample;
    this._alt    = alt;
    this._fovy   = 45;
    this._aspect = this._ample / this._alt;
    this._znear  = 0.1;
    this._zfar   = 100.0;
     
    this._ymax   = this._znear * Math.tan(this._fovy * Math.PI / 360.0);
    this._xmax   = this._ymax * this._aspect;
    
    this._animacioActiva  = false;
    this._animacio        = new Array();
    var veLatLon = [0,0];
    this.calcularLatLong(veLatLon,1);
    this._lat = isNaN(veLatLon[0]) ? 0 : veLatLon[0];
    this._lon = isNaN(veLatLon[1]) ? 0 : veLatLon[1];
    
    this.DIST_MIN = 0.002685547;
    this.DIST_MAX = 340;
    
    this._distApropar = null;
    
}

Camera.prototype.activarAnimacio = function() {
    this._animacioActiva = true;
};

Camera.prototype.animacioActiva = function() {
    return this._animacioActiva;
};

Camera.prototype.animarGir = function(lat, lon, mapa, escena) {
    // Comprovem si animem
    if (this._animacioActiva) {
        var cam = this;
        var graus = 5;
        var animar = false;

        // Girem Latitud
        var difLats = lat.toFixed(5) - this._lat.toFixed(5);
        var angle    = Math.abs(difLats) > graus ? graus : Math.abs(difLats);
        var sentit   = difLats < 0 ? -1 : 1;
        
        // Definim el eix de rotació de la latitud
        var v = vec3.create(this._posicio);
        vec3.negate(v);
        var u = vec3.create([0, 1, 0]);
        var eix = vec3.create();
        
        vec3.cross(u, v, eix);
        
        if (0.01 < Math.abs(angle)) {
            this.girar(7, 2, (angle*sentit)*4, eix);
            animar = this._animacioActiva;
        }
       
        // Girem Longitud
        var difLons = lon.toFixed(5) - this._lon.toFixed(5); 
        angle    = Math.abs(difLons) > graus ? graus : Math.abs(difLons);
        sentit   = difLons < 0 ? -1 : 1;
    
        if (0.01 < Math.abs(difLons)) {
            this.girar(5, 2, (angle*sentit)*4);
            animar = this._animacioActiva;
        }
        
        // Avancem/retrocedim la càmera per girar més ràpit
       var zoom = this.calcZoom();
       if (this._distApropar > Math.abs(difLons) && this._distApropar > Math.abs(difLats)) {
           if (11 > zoom) {
               this.moureEndavant(3);
               animar = this._animacioActiva;
           }
       } else {
           if (4 < zoom) {
               this.moureEndarrera(3);
           } else if (4 > zoom) {
               this.moureEndavant(3);
           }
       }

        if (animar) {
            mapa.actualitzar(cam);
            escena.dibuixarEscena();
            setTimeout(function(){cam.animarGir(lat, lon, mapa, escena);}, 250);
        } else {
            this._animacioActiva = false;
        }
       
        // Recalculem la latitud/longitud
        var vec = [0,0];
        this.calcularLatLong(vec, 1);
    }
};

Camera.prototype.aturarAnimacio = function() {
    this._animacioActiva = false;
};

Camera.prototype._interseccioRaigEsfera = function(origen, vectorZ, eCentre, eRadi) {    
    var a = 1 // Perque vectorZ està normalitzat
    var b = 2 * (vectorZ[0] * (origen[0] - eCentre[0]) + vectorZ[1] * (origen[1] - eCentre[1]) + vectorZ[2] * (origen[2] - eCentre[2]));
    var c = Math.pow((origen[0] - eCentre[0]), 2) + Math.pow((origen[1] - eCentre[1]), 2) + Math.pow((origen[2] - eCentre[2]), 2) - Math.pow(eRadi, 2);
    
    var discriminant = (b*b) - (4*a*c);
    var distPetita = 0;
    
    if (0 > discriminant) {
        // No hi ha intersecció
        return null;
    } else if (0 == discriminant) {
        // Hi ha una intersecció
        distPetita = -b / (2*a);
    } else {
        // Hi ha dos interseccions
        var arrel = Math.sqrt(discriminant);
        var t0 = (-b - arrel) / (2*a);
        var t1 = (-b + arrel) / (2*a);
        
        distPetita = Math.abs(t0) < Math.abs(t1) ? t0 : t1;
    }
    
    return distPetita;
};

/**
 * Calcula la latitud i la longitud de la càmera, o el vectorZ
 * @param vecLatLong array  Variable a on guardarem la latitud i la longitud
 * @param eix        number Variabla que indica l'eix a calcular la lat/long. 0->vectorZ, 1->PosCamera
 */
Camera.prototype.calcularLatLong = function(vectorLatLong, eix) {
    var vectorZ;

    if (0 == eix) {
        vectorZ = vec3.create(this.getVectorZ());
    } else {
        vectorZ = vec3.create([0,0,0]);
        vec3.normalize(vectorZ);
    }
    
    this.calcularLatLonVector(vectorZ, vectorLatLong);
    this._lat = isNaN(vectorLatLong[0]) ? 0 : vectorLatLong[0];
    this._lon = isNaN(vectorLatLong[1]) ? 0 : vectorLatLong[1];
    this.mostrarLatLon(vectorLatLong);
    return vectorLatLong;
};

/**
 * El punt ha d'està normalitzat, valor entre 0..1
 */
Camera.prototype.calcularLatLonPosPantalla = function(puntX, puntY, vecLatLon) {
    var viewPort = [0, 0, this._ample, this._alt];
    var origen = vec3.create();
    var desti  = vec3.create();
    var vector = vec3.create();

    // Començament del Ray
    var result1 = Utils.gluUnProject(
      puntX, puntY, 0.0,
      mvMatrix, pMatrix,
      viewPort, origen);

    // Final del Ray
    var result2 = Utils.gluUnProject(
      puntX, puntY, 1.0,
      mvMatrix, pMatrix,
      viewPort, desti);
    
    vec3.subtract(origen, desti, vector);
    vec3.normalize(vector);
    
    var vecLatLon = [0, 0];
    this.calcularLatLonVector(vector, vecLatLon);

    this.mostrarLatLon(vecLatLon);
    
    return vecLatLon;
};

Camera.prototype.calcularLatLonPuntInter = function(puntInter, vecLatLon) {
    // Latitud 
    var vCamLat0 = vec3.create([puntInter[0], 0, puntInter[2]]);
    var signeLat = 0 < puntInter[1] ? 1 : -1;
    var signeLon = 0 < puntInter[0] ? 1 : -1;
    
    // Latitud
    vecLatLon[0] = this._calcularAngleEntreVectors(vCamLat0, puntInter) * signeLat;
    
    // Longitud
    vecLatLon[1] = this._calcularAngleEntreVectors([0, 0, 1], vCamLat0) * signeLon;
    
    return vecLatLon;
};

Camera.prototype.calcularLatLonVector = function(direccio, vecLatLon) {
    var origen = vec3.create(this._posicio);
    var t0 = this._interseccioRaigEsfera(origen, direccio, vec3.create([0, 0, 0]), 100);
    this._puntInter = vec3.create(direccio);
    vec3.scale(this._puntInter, t0);
    vec3.add(this._puntInter, origen);

    this.calcularLatLonPuntInter(this._puntInter, vecLatLon);
    
    return vecLatLon;
};

Camera.prototype._calcularAnglePlaVector = function(pla, vector) {
    var dot = vec3.dot(pla, vector);
    var angl;
    
    // Si el producte escalar es 0, l'angle resultant serà 0
    if (0 != dot) {
        var modulpla    = vec3.length(pla);
        var modulvector = vec3.length(vector);
        
        var alpha = dot / (modulpla*modulvector);
        angl = Math.asin(alpha); 
        angl = angl * 180 / Math.PI; // El resultat es en radians, passem a graus 
    } else {
        angl = 0;
    }
    
    return angl;
};

Camera.prototype._calcularAngleEntreVectors = function(v1, v2) {
    
    var dot = vec3.dot(v1, v2);
    var angl;
    
    var modulv1 = vec3.length(v1);
    var modulv2 = vec3.length(v2);
    
    var alpha = dot / (modulv1*modulv2);
    angl = Math.acos(alpha); 
    angl = angl * 180 / Math.PI; // El resultat es en radians, passem a graus 
    
    return angl;
};

Camera.prototype.crearAnimacio = function(lat, lon, mapa, escena) {
    var lonAprop = Math.abs(lon.toFixed(5) - this._lon.toFixed(5)) / 2;
    var latAprop = Math.abs(lat.toFixed(5) - this._lat.toFixed(5)) / 2;
    this._distApropar = lonAprop < latAprop ? lonAprop : latAprop; 
    this.activarAnimacio();
    
    this.animarGir(lat, lon, mapa, escena);
};

 // Getters
Camera.prototype.miraAlCentre    = function() { return 0 == this.getAngleCentre();};
Camera.prototype.getDistCentre   = function() { return vec3.length(this._posicio);};
Camera.prototype.getDistSup      = function() { return vec3.length(this._posicio)-100;};
Camera.prototype.getLat          = function() { return isNaN(this._lat) ? 0 : this._lat; };
Camera.prototype.getLon          = function() { return isNaN(this._lon) ? 0 : this._lon; };
Camera.prototype.getPosicio      = function() { return this._posicio; };
Camera.prototype.getPuntMira     = function() { return this._puntMira; };
Camera.prototype.getSistemaCoord = function() { return this._sistemaCoord; };
Camera.prototype.getZoom         = function() { return this._zoom; };
Camera.prototype.calcZoom        = function() { return (18 - Math.round(Math.log(this.getDistSup()/this.DIST_MIN)/Math.log(2)));};
Camera.prototype.getVectorX      = function() { return vec3.create([this._sistemaCoord[0], this._sistemaCoord[1], this._sistemaCoord[2]])};
Camera.prototype.getVectorY      = function() { return vec3.create([this._sistemaCoord[3], this._sistemaCoord[4], this._sistemaCoord[5]])};
Camera.prototype.getVectorZ      = function() { return vec3.create([this._sistemaCoord[6], this._sistemaCoord[7], this._sistemaCoord[8]])};


/**
 * Gira la càmera per els 3 eixos del sistema de coordenades
 * @param eix        number Número de l'0 al 2 que indica quin eix s'ha de modificar (X, Y, Z)
 * @param pCentreRot number Número que indica quin es el centre de la rotació [ 0-> posicioCam, 1-> puntMiraCam, 2->centreEsfera]
 * @param graus      number Valor dels graus de la rotació, en graus, ja que a superFuncio es converteixen a radians
 * 
 */
Camera.prototype.girar = function(eix, pCentreRot, graus, vectorEixParam) {
    var vectorEix;
    if (3 > eix) {
        vectorEix   = vec3.create([this._sistemaCoord[(0+(eix*3))], this._sistemaCoord[(1+(eix*3))], this._sistemaCoord[(2+(eix*3))]]);
    } else {
        switch(eix)
        {
            case 4: 
                vectorEix = vec3.create([1, 0, 0]);
                break;
            case 5: 
                vectorEix = vec3.create([0, 1, 0]);
                break;
            case 6: 
                vectorEix = vec3.create([0, 0, 1]);
                break;
            case 7:
                if (null != vectorEixParam) {
                    vectorEix = vec3.create(vectorEixParam);
                } else {
                    return false;
                }
                
                break;
        }
    }
    
    graus = graus / (1 << this.calcZoom());
    
    if (0 == pCentreRot)      this._superFuncio(graus, this._posicio  , vectorEix, this._puntMira); 
    else if (1 == pCentreRot) this._superFuncio(graus, this._puntMira , vectorEix, this._posicio);
    else if (2 == pCentreRot) this._superFuncio(graus, [0.0, 0.0, 0.0], vectorEix, this._posicio);
    
    var vec = [0,0];
    this.calcularLatLong(vec, 1);
};

Camera.prototype.getMvMatriu = function() {
    var vecX = vec3.create(this.getVectorX()); 
    var vecY = vec3.create(this.getVectorY()); 
    var vecZ = vec3.create(this.getVectorZ());
    var pos  = vec3.create(this._posicio);
    var dest = mat4.create();
    
    dest[0]  = vecX[0];
    dest[1]  = vecY[0];
    dest[2]  = vecZ[0];
    dest[3]  = 0;
    dest[4]  = vecX[1];
    dest[5]  = vecY[1];
    dest[6]  = vecZ[1];
    dest[7]  = 0;
    dest[8]  = vecX[2];
    dest[9]  = vecY[2];
    dest[10] = vecZ[2];
    dest[11] = 0;
    dest[12] = -(vecX[0]*pos[0] + vecX[1]*pos[1] + vecX[2]*pos[2]);
    dest[13] = -(vecY[0]*pos[0] + vecY[1]*pos[1] + vecY[2]*pos[2]);
    dest[14] = -(vecZ[0]*pos[0] + vecZ[1]*pos[1] + vecZ[2]*pos[2]);
    dest[15] = 1;
    
    return dest;
};

/**
 * Métode per mostrar en la pantalla la latitud i longitud passada. Carrega la informació al div amb l'identificador 'peu-pagina'
 * @param vecLatLon  array  Array amb les dades de la latitud (0) i la longitud (1)
 */
Camera.prototype.mostrarLatLon = function(vecLatLon) {
    var lat = isNaN(vecLatLon[0]) ? 0 : vecLatLon[0];
    var lon = isNaN(vecLatLon[1]) ? 0 : vecLatLon[1];
    
    var latGraus = Math.abs(Math.floor(lat));
    var latAux   = (Math.abs(lat) - latGraus) * 60;
    var latMin   = Math.abs(Math.floor(latAux));
    var latSeg   = Math.abs(Math.floor((Math.abs(latAux) - latMin) * 60));
    
    var lonGraus = Math.abs(Math.floor(lon));
    var lonAux   = (Math.abs(lon) - lonGraus) * 60;
    var lonMin   = Math.abs(Math.floor(lonAux));
    var lonSeg   = Math.abs(Math.floor((Math.abs(lonAux) - lonMin) * 60));
    
    var nort, est;
    // Comprobem si es lat nord
    if (lat >= 0) {
        nort = 'N';
    } else {
        nort = 'S';
        latMin = 60 - latMin;
    }// Comprobem si es lat nord
    if (lon >= 0) {
        est = 'E';
    } else {
        est = 'O';
        lonMin = 60 - lonMin;
    }
    
    var nort = lat > 0 ? 'N' : 'S';
    var est  = lon > 0 ? 'E' : 'O';
    
    dojo.byId('peu-pagina').innerHTML = "Lat: "+latGraus+"&deg; "+latMin+"' "+latSeg+"'' "+nort+"   Long: "+lonGraus+"&deg; "+lonMin+"' "+lonSeg+"'' "+est;
}

/**
 * Mou la càmera per els 3 eixos del sistema de coordenades
 * @param eix    number Número de l'0 al 2 que indica quin eix s'ha de modificar
 * @param sentit number Número que indica si la càmera ha d'avançar o retrocedir segons el sentit [ 1-> endevant, -1-> endarrera]
 */
Camera.prototype.moure = function(eix, valorSentit){
    // Agafem el vector del sistema de coordenades de la càmara
    var auxPos = eix*3;
    var vectorDireccio = vec3.create([this._sistemaCoord[(0+auxPos)], this._sistemaCoord[(1+auxPos)], this._sistemaCoord[(2+auxPos)]]);
    
    vec3.normalize(vectorDireccio);
    vec3.scale(vectorDireccio, valorSentit);
    // Calculem la nova posició de la càmara --> novaPos = posCam + longitudPas*VectorDireccioNormalitzat
    vec3.add(this._posicio,  vectorDireccio);
    vec3.add(this._puntMira, vectorDireccio);
    
    var vec = [0,0];
    this.calcularLatLong(vec, 1);
};

Camera.prototype.moureEndavant = function(multipliquem) {
    var zoom = this.calcZoom();
    if(18 > zoom) {
        var pass = -15 / (1 << zoom);
        if (null != multipliquem) {
            pass *= multipliquem;
        }
        pass = pass > this.getDistSup() ? this.getDistSup : pass;
        this.moure(2, pass);
    }
};

Camera.prototype.moureEndarrera = function(multipliquem) {
    var zoom = this.calcZoom();
    if (0 < zoom) {
        var pass = 15 / (1 << zoom);
        if (null != multipliquem) {
            pass *= multipliquem;
        }
        pass = pass > this.getDistSup() ? this.getDistSup : pass;
        this.moure(2, pass);
    }
};


Camera.prototype.missatge = function(scroll){
    console.log(" scroll: "+scroll);
};

 // Setters
Camera.prototype.setLat          = function(latP)      { this._lat          = latP; };
Camera.prototype.setLon          = function(longP)     { this._lon          = longP; };
Camera.prototype.setPosicio      = function(posP)      { this._posicio      = posP; };
Camera.prototype.setPuntMira     = function(puntMP)    { this._puntMira     = puntMP; };
Camera.prototype.setSistemaCoord = function(sistemaCP) { this._sistemaCoord = sistemaCP; };
Camera.prototype.setZoom         = function(zoomP)     { this._zoom         = zoomP; };


// Métodes Privats
Camera.prototype._superFuncio = function(graus, punt, vector, puntARotar){

    //graus = 90;   
    var angleRad = graus * Math.PI / 180.0;
    
    var matriuTrans = mat4.create();
    mat4.identity(matriuTrans);
    
    mat4.translate(matriuTrans, punt);
    mat4.rotate(matriuTrans, angleRad, vector);
    mat4.translate(matriuTrans, vec3.negate(punt, vec3.create()));
    
    var matSCoord = mat4.create();
    mat3.toMat4(this._sistemaCoord, matSCoord);
    matSCoord[12] = puntARotar[0];
    matSCoord[13] = puntARotar[1];
    matSCoord[14] = puntARotar[2];
                
    mat4.multiply(matriuTrans, matSCoord);
    
    var vecX   = vec3.create([matriuTrans[0], matriuTrans[1], matriuTrans[2]]);
    var vecY   = vec3.create([matriuTrans[4], matriuTrans[5], matriuTrans[6]]);
    var vecZ   = vec3.create([matriuTrans[8], matriuTrans[9], matriuTrans[10]]);
    
    vec3.set([matriuTrans[12], matriuTrans[13], matriuTrans[14]], puntARotar); 
    
    vec3.normalize(vecX);
    vec3.normalize(vecY);
    vec3.normalize(vecZ);

    mat4.identity(this._sistemaCoord);
    this._sistemaCoord[0] = vecX[0];
    this._sistemaCoord[1] = vecX[1];
    this._sistemaCoord[2] = vecX[2];
    this._sistemaCoord[3] = vecY[0];
    this._sistemaCoord[4] = vecY[1];
    this._sistemaCoord[5] = vecY[2];
    this._sistemaCoord[6] = vecZ[0];
    this._sistemaCoord[7] = vecZ[1];
    this._sistemaCoord[8] = vecZ[2];
    
    var vec = [0,0];
    this.calcularLatLong(vec, 1);
    
    return puntARotar;
};
