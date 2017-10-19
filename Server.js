function Server() {
	this.name = document.querySelector('meta[name="ogame-universe-name"]').getAttribute('content');
	this.version = document.querySelector('meta[name="ogame-version"]').getAttribute('content');
	this.speed = parseInt(document.querySelector('meta[name="ogame-universe-speed"]').getAttribute('content'));
	this.fleetSpeed = parseInt(document.querySelector('meta[name="ogame-universe-speed-fleet"]').getAttribute('content'));
	this.donutGalaxy = document.querySelector('meta[name="ogame-donut-galaxy"]').getAttribute('content') ? true : false;
	this.donutSystem = document.querySelector('meta[name="ogame-donut-system"]').getAttribute('content') ? true : false;
}

