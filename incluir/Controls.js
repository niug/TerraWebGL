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
 * @fileoverview Objecte Controls. Classe encarregada de escoltar els events del
 * teclat i la rata, així com el resize de la pantalla,...
 * 
 * @author redribbon
 */
var Controls = function(escena, camera, mapa, canvas) {
    this._escena = escena;
    this._camera = camera;
    this._mapa   = mapa;
    this._teclesApretades = Object();
    this._botoRataApretat = false;
    this._ultimaPosX      = null;
    this._ultimaPosY      = null;

    this._inputActiu      = false;
    
    this.inicialitzarEvents(document, canvas);
}

Controls.prototype.animarGir = function(lat, lon) {
    this._camera.crearAnimacio(lat, lon, this._mapa, this._escena);
};

Controls.prototype.tileCarregada = function(){
    this._escena.dibuixarEscena();
}
/**
 * Inicialitza els events conectanlos mitjançant Dojo, amb el métode determinat
 */
Controls.prototype.inicialitzarEvents = function(documentParam, canvasParam) {
    // Programem els events de la rata
    dojo.connect(documentParam, 'onmousedown', this, "rataApretada");
    dojo.connect(documentParam, 'onmouseup'  , this, "rataDeixada");
    dojo.connect(documentParam, 'onmousemove', this, "rataMoguentse");
            
    dojo.connect(documentParam, (!dojo.isMozilla ? "onmousewheel" : "DOMMouseScroll"), this, "rodaRata");
    
    // Programem els events del teclat
    dojo.connect(documentParam, 'onkeydown', this, "teclaApretada");
    dojo.connect(documentParam, 'onkeyup'  , this, "teclaDeixada");
    
    //Programem l'esdeveniment de canvi de tamany de la pantalla
    dojo.connect(window, 'onresize', this, "resize");
};

Controls.prototype.mourem = function() {
    // Rotació sobre l'eix Z de la càmera
    if (this._teclesApretades[85]) { //U -> Esquerra
        this._camera.girar(2,0,5);
    }
    if (this._teclesApretades[79]) { //O -> Dreta
        this._camera.girar(2,0,-5);
    }
    
    // Rotació sobre l'eix Y de la càmera
    if (this._teclesApretades[37]) { //<- Esquerra
        this._camera.girar(1,0,5);
    }
    if (this._teclesApretades[39]) { //-> Dreta
        this._camera.girar(1,0,-5);
    }   
    
    // Rotació sobre l'eix X de la càmera
    if (this._teclesApretades[38]) { //^ Amunt
        this._camera.girar(0,0,5);
    }
    if (this._teclesApretades[40]) { //`´ Avall
        this._camera.girar(0,0,-5);
    }
    
    // Moure la càmera sobre els seus tres eixos
    if (this._teclesApretades[65]) { //A -> Esquerra
        this._camera.moure(0,8);
    }
    if (this._teclesApretades[83]) { //S -> Allunyar
        this._camera.moureEndarrera();
    }
    if (this._teclesApretades[68]) { //D -> Dreta
        this._camera.moure(0,-8);
    }
    if (this._teclesApretades[87]) { //W -> Apropar
        this._camera.moureEndavant();
    }
    if (this._teclesApretades[82]) { //R -> Amunt
        this._camera.moure(1,-8);
    }
    if (this._teclesApretades[70]) { //F -> Avall
        this._camera.moure(1,8);
    }
    
    // Info de la càmera
    if (this._teclesApretades[67]) { //C
        var latLong =[0,0];
        this._camera.calcularLatLong(latLong,0);
        console.log("posCam: "+vec3.str(this._camera.getPosicio())+", puntMira: "+vec3.str(this._camera.getPuntMira()));
        console.log("latitudCamera: "+latLong[0]+"longitudCamera: "+latLong[1]);
        console.log("DistCentre: "+this._camera.getDistCentre());
        console.log("DistCentre: "+this._camera.getDistSup());
    }
    
    // Girar la camera al voltant de la terra
    if (this._teclesApretades[73]) { // I -> Amunt
        this._camera.girar(0,2,1);
    }
    if (this._teclesApretades[75]) { // K -> Avall
        this._camera.girar(0,2,-1);
    }
    if (this._teclesApretades[76]) { // L -> Dreta
        this._camera.girar(1,2,1);
    }
    if (this._teclesApretades[74]) { // J -> Esquerra
        this._camera.girar(1,2,-1);
    }
    
    if (this._teclesApretades[86]) { // V rotar 90º sobre l'eix Y al voltant de la terra
        this._camera.girar(1,2,90);
    }
    
    this._mapa.actualitzar(this._camera);
    this._escena.dibuixarEscena();
}

// Events de la RATA
Controls.prototype.rataApretada = function(event) {
    this._botoRataApretat = true;
    this._ultimaPosX      = event.clientX;
    this._ultimaPosY      = event.clientY;
    
    // Si l'animació està activa, l'aturem
    if (this._camera.animacioActiva()) {
        this._camera.aturarAnimacio();
    }
};

Controls.prototype.rataDeixada = function(event) {
    this._botoRataApretat = false;
};

Controls.prototype.rataMoguentse = function(event){
    var newX = event.clientX;
    var newY = event.clientY;
    
    var vecLatLon = [0, 0];
    this._camera.calcularLatLonPosPantalla(newX, newY, vecLatLon);
    this._escena.setPunt(this._camera._puntInter);
    this._escena.dibuixarEscena();
    
    if (!this._botoRataApretat) {
        this._ultimaPosX = newX
        this._ultimaPosY = newY;
        return;
    }
    //Calculem la rotació/moviment a aplicar
    var movX = (newX - this._ultimaPosX) * 2;
    this._camera.girar(1,2,-movX);
    
    var movY = (newY - this._ultimaPosY) * 2;
    this._camera.girar(0,2,-movY);
    
    this._ultimaPosX = newX;
    this._ultimaPosY = newY;
    
    // Actualitzem l'escena
    this._mapa.actualitzar(this._camera);
    this._escena.dibuixarEscena();
};

Controls.prototype.resize = function(e) {
    this._escena.resize();
};

Controls.prototype.rodaRata = function(e) {
    var scroll = e[(!dojo.isMozilla ? "wheelDelta" : "detail")] * (!dojo.isMozilla ? 1 : -1);
    if (scroll < 0) {
        this._camera.moureEndarrera(3);
    } else {
        this._camera.moureEndavant(3);
    }

    this._mapa.actualitzar(this._camera);
    this._escena.dibuixarEscena();
};

// Events del TECLAT
Controls.prototype.teclaApretada = function(e) {
    this._teclesApretades[e.keyCode] = true;
    
    // Si el input per fer la búsqueda no està actiu, parem l'animació i movem segons la tecla
    if (false == this._inputActiu) {
        if (true == this._camera.animacioActiva()) {
            this._camera.aturarAnimacio();
        }
        this.mourem();
    }
};

Controls.prototype.teclaDeixada = function(e) {
    this._teclesApretades[e.keyCode] = false;
};
    
