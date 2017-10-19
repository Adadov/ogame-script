﻿// ==UserScript==
// @name        	InfoCompteRevised
// @namespace   	nfcrev
// @description 	Refonte complète du script InfoCompte
// @vOGgame     	6.3.9
// @version     	1.0.0
// @author      	Adadov
// @grant			GM_getValue
// @grant			GM_setValue
// @grant			GM_deleteValue
// @grant			GM_getResourceURL
// @grant			GM_xmlhttpRequest
// @grant      		GM_addStyle

// @updateURL
// @downloadURL

// @include     	*.ogame*gameforge.com/game/index.php?page=*
// @exclude        	*.ogame*gameforge.com/game/index.php?page=displayMessageNewPage*
// @exclude        	*.ogame*gameforge.com/game/index.php?page=standalone*

// ==/UserScript==

//SERVER
function Server() {
	this.name = document.querySelector('meta[name="ogame-universe-name"]').getAttribute('content');
	this.version = document.querySelector('meta[name="ogame-version"]').getAttribute('content');
	this.speed = parseInt(document.querySelector('meta[name="ogame-universe-speed"]').getAttribute('content'));
	this.fleetSpeed = parseInt(document.querySelector('meta[name="ogame-universe-speed-fleet"]').getAttribute('content'));
	this.donutGalaxy = document.querySelector('meta[name="ogame-donut-galaxy"]').getAttribute('content') ? true : false;
	this.donutSystem = document.querySelector('meta[name="ogame-donut-system"]').getAttribute('content') ? true : false;
}

//PLANETSTORE
function PlanetStorage() {
	this['datas']['number'] = 0;
	this['datas']['planets'] = {};
};
PlanetStorage.prototype = {
	load: function() {
		var raw = JSON.parse(localStorage.getItem('ICR_PlanetStore'));
	},
	save: function() {
		var json = JSON.stringify(this);
		localStorage.setItem('ICR_PlanetStore', json);
		GM_setValue('ICR_PlanetStore', json);
	},
	get: function(planetID) {},
	set: function(oPlanet) {}
	add: function(oPlanet) {},
	delete: function(planetID)
};

//PLANET
function Planet(pid,nom,coord) {
	this['id'] = 0;
	this['nom'] = "";
	this['type'] = 0;
	this['resources'] = {
		metal: 0,
		cristal: 0,
		deuterium: 0
	};
	this['production'] = {
		metal: 0,
		cristal: 0,
		deuterium: 0
	};
	this['mines'] = {};
	this['defenses'] = {};
	this['flotte'] = {};
	this['temperature'] = {};
	this['moonID'] = 0;
	this['coordinates'] = {};
	this['moon'] = 0;
	this['planetID'] = 0;

	if ( typeof pid == 'undefined' ) { return this; }
	else if ( typeof pid == 'object' ) {
		for(k in pid) {
			this[k] = pid[k];
		}
		return this;
	}

	this['id'] = pid;
	this['nom'] = nom;
	this['type'] = 0;

	if (typeof coord == 'string') {
		var coordinates = coord.replace('[','').replace(']','').split(':');
		this['coordinates'] = {
			galaxy: coordinates[0],
			system: coordinates[1],
			position: coordinates[2]
		};
	} else {
		this['coordinates'] = coord;
	}
};
Planet.prototype = {
	addMoon: function(div) {
		var moonID = parseInt(/([0-9]+)$/.exec(div.getAttribute('href'))[0]);
		var moonName = div.getElementsByTagName('img')[0].getAttribute('alt');
		this['moonID'] = moonID;

		var Moon = new Planet(moonID, moonName, this['coordinates']);
		Moon['planetID'] = this['id'];

		return Moon;
	},
	updateDatas: function() {},
	isMoon: function() {
		return this['planetID'] == 0 ? false : true;
	},
	hasMoon: function() {
		return this['moonID'] == 0 ? false : true;
	},
	updResources: function(metal=0, cristal=0, deuterium=0) {
		if ( metal != 0 ) {
			this['resources']['metal'] = metal;
		}
		if ( cristal != 0 ) {
			this['resources']['cristal'] = cristal;
		}
		if ( deuterium != 0 ) {
			this['resources']['deuterium'] = deuterium;
		}
	},
	updProd: function(type) {
		if (type == 'metal') {
			var prod = Math.ceil(30 * this.mines.metal * Math.pow(1.1, this.mines.metal));
		}
		if (type == 'cristal') {
			var prod = Math.ceil(20 * this.mines.cristal * Math.pow(1.1, this.mines.cristal));
		}
		if (type == 'deut') {
			var prod = Math.ceil((20 * this.mines.deut * Math.pow(1.1, this.mines.deut) * (-0.004 * this.temperature.moyen + 1.44) ));
		}

	},
	updFlotte: function() {},
	getDetails: function() {
		var details;
			console.log(this);
		if (!this.isMoon()) {
			var div = document.querySelector('div[id="planet-'+this.id+'"]').getElementsByClassName('planetlink')[0];
			details = /<br\/>([0-9\.]+)km \(([0-9]+)\/([0-9]+)\)<br\/?>(-?[0-9]+)\s*°C[^0-9]*([0-9]+)\s*°C<br\/>/
				.exec(div.getAttribute('title'));
			// 1: taille | 2: used | 3: total | 4: temp min | 5: temp max
			this['temp_min'] = parseInt(details[4]);
			this['temp_max'] = parseInt(details[5]);
		} else {
			var div = document.querySelector('div[id="planet-'+this['planetID']+'"]').getElementsByClassName('moonlink')[0];
			details = /<br>([0-9\.]+)km \(([0-9]+)\/([0-9]+)\)<br\/?>/.exec(div.getAttribute('title'));
			// 1: taille | 2: used | 3: total
		}
		console.log(details);
		this['taille'] = parseInt(details[1].replace(/\./g, ''));
		this['used'] = parseInt(details[2]);
		this['cases'] = parseInt(details[3]);
	}
};

//SCRIPT
var Version = '1.0.0';

var start_time = (new Date()).getTime();

var url = location.href;

var isFireFox = navigator.userAgent.indexOf("Firefox") > -1 || navigator.userAgent.indexOf("Iceweasel") > -1;
var isOpera   = navigator.userAgent.indexOf('Opera') > -1;
var isChrome  = navigator.userAgent.indexOf('Chrome') > -1;
var isSafari  = navigator.userAgent.indexOf("Safari") > -1;
var isTamper  = false;

var nomScript = isFireFox ? '' : 'InfoCompte3';


function getCurrentPlanet() {
	//console.log(document.querySelector('meta[name="ogame-planet-id"]').getAttribute('content'));
	var id = document.querySelector('meta[name="ogame-planet-id"]').getAttribute('content');
	if (Planets.hasOwnProperty(id)) {
		//Planets[id].updateDatas();
		return Planets[id];
	} else {
		console.log('Impossible de trouver la planète dans la DB !! ID: '+id);
		return false;
	}
}

function checkPlanets(Planets) {
	var ids = {};
	var divs = document.getElementsByClassName('smallplanet');
	for (var i=0; i<divs.length; i++) {
		var id = parseInt(divs[i].id.split('-')[1]);
		ids[id] = true;
	}
	var modified = 0;

	for(k in ids) {
		var div = document.querySelector('div[id="planet-'+k+'"]');
		var iID = parseInt(k);

		if (!Planets.hasOwnProperty(iID)) {
			var name = div.getElementsByClassName('planet-name')[0].innerHTML;
			var coords = div.getElementsByClassName('planet-koords')[0].innerHTML;
			Planets[iID] = new Planet(iID, name, coords, 'planet');
			modified++;
		}
		if (div.getElementsByClassName('moonlink')[0]) {
			var IDmoon = parseInt(/([0-9]+)$/.exec(div.getElementsByClassName('moonlink')[0].getAttribute('href'))[0]);
			// Création de la lune dans la base et lien avec la planète
			ids[IDmoon] = true;
			if (!Planets.hasOwnProperty(IDmoon)) {
				Planets[IDmoon] = Planets[k].addMoon(div.getElementsByClassName('moonlink')[0]);
				modified++;
			}
		}
		Planets[iID].getDetails();
	}
	//console.log("Liste planètes:", Planets);

	for (k in Planets) {
		if (!ids.hasOwnProperty(parseInt(k))) {
			console.log('Planète supprimée ! '+k.toString(), Planets[k]);
			delete Planets[k];
			modified = true;
		}
	}
	if (modified) {
		console.log("Sauvegarde liste !!",Planets);
		GM_setValue('ICRPlanets', JSON.stringify(Planets));
		localStorage.setItem('ICR_Planets', JSON.stringify(Planets));
	}
}

function prodMetalbase(mm, speed) {
	return 30*(mm)*Math.pow(1.1, (mm))*speed;
}

function prodCristalbase(mc, speed) {
	return 20*(mc)*Math.pow(1.1, (mc))*speed;
}

function prodDeutbase(md, speed, temperature) {
	return 10 * (md) * (Math.pow(1.1,(md)) * (1.44 - (temperature * 0.004) ))*speed;
}
function prodMetal(mm,speed, lvlplasma, geologue, booster) {
	var base = prodMetalbase(mm, speed);
	return Math.round(base*geologue)  +  Math.round(base*lvlplasma/100) + Math.round(base*booster/100);
}

function prodCristal(mc,speed, lvlplasma, geologue, booster) {
	var base = prodCristalbase(mc, speed);
	return Math.round(base*geologue)  + Math.round(base*lvlplasma*0.66/100) + Math.round(base*booster/100);
}

function prodDeut(md,speed, lvlplasma, temperature, geologue, booster) {
	var base = prodDeutbase(md, speed, temperature);
	return Math.round(base*geologue) +  Math.round(base*lvlplasma*0.33/100) + Math.round(base*booster/100);
}


// Calculs
// Mines:
//   Met : 30 x N x 1.1^N
//   Cri : 20 x N x 1.1^N
//   Deu : (10 x N x 1.1^N) x (-0.004 x T + 1.44)

// ==================================
// #  INIT
// ==================================

var srvDatas = new Server();
localStorage.setItem('ICR_Server', JSON.stringify(srvDatas));

GM_setValue('ICRPlanets', '{}');
var Planets = {}, PlanetIDS = [];
var PlanetsDatas = JSON.parse(GM_getValue('ICRPlanets'));

if (PlanetsDatas != null) {
	for (k in PlanetsDatas) {
		Planets[k] = new Planet(PlanetsDatas[k]);
	}
}

var pageName;

if(pageName = /component=(empire)/.exec(url)) {
	// Vue empire
} else if (pageName = /page=(resources|overview|station|research|shipyard|defense|fleet[1-3]|galaxy)/.exec(url)) {
	checkPlanets(Planets);

	// Update current planet
	var CurPlanet = getCurrentPlanet();

	// MAJ des ressources + production
	//var rezUL = document.getElementById('resources');
	//console.log(rezUL);

	var metal = parseInt(document.getElementById('resources_metal').innerHTML.replace(/[.,]/g,''));
	var crystal = parseInt(document.getElementById('resources_crystal').innerHTML.replace(/[.,]/g,''));
	var deuterium = parseInt(document.getElementById('resources_deuterium').innerHTML.replace(/[.,]/g,''));
	CurPlanet.updResources(metal,crystal,deuterium);
	console.log(CurPlanet);

	GM_setValue('ICRPlanets', JSON.stringify(Planets));
	localStorage.setItem('ICR_Planets', JSON.stringify(Planets));

	// ==================================
	// #  Traitement spécifique aux pages
	// ==================================
	// Mines
	if (pageName == 'resources') {
	}
}

// console.log(Planets);
GM_setValue('ICRPlanets', JSON.stringify(Planets));
localStorage.setItem('ICR_Planets', JSON.stringify(Planets));
