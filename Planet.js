function Planet(pid,nom,coord) {
	this.id = 0;
	this.nom = "";
	this.type = 0;
	this.resources = {
		metal: 0,
		cristal: 0,
		deuterium: 0
	};
	this.production = {
		metal: 0,
		cristal: 0,
		deuterium: 0
	};
	this.mines = {};
	this.defenses = {};
	this.flotte = {};
	this.temperature = {};
	this.moonID = 0;
	this.coordinates = {};
	this.moon = 0;
	this.planetID = 0;

	if ( typeof pid == 'undefined' ) { return this; }
	else if ( typeof pid == 'object' ) {
		for(k in pid) {
			this[k] = pid[k];
		}
		console.log(this['id']);
		return this;
	}

	this.id = pid;
	this.nom = nom;
	this.type = 0;

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
		console.log('Create moon: '+Moon['id'].toString());
		console.log(Moon);


		return Moon;
	},
	updateDatas: function() {
		console.log('ICR - Update');
	},
	isMoon: function() {
		return this['planetID'] == 0 ? false : true;
	},
	hasMoon: function() {
		return this['moonID'] == 0 ? false : true;
	},
	updResources: function(metal=0, cristal=0, deuterium=0) {
		if ( metal != 0 ) {
			this.resources['metal'] = metal;
		}
		if ( cristal != 0 ) {
			this.resources['cristal'] = cristal;
		}
		if ( deuterium != 0 ) {
			this.resources['deuterium'] = deuterium;
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
