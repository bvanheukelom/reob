Garden = function Garden( name, id ){
	this._id = id;
	this.name = name;
	this.plants = [];
	this.harvested = 0;
};
// declares Garden as an Entity
omm.addEntity(Garden);
// declares that the property "plants" contains objects of the type "Plant"
omm.arrayType(Garden, "plants", "Plant");

Garden.prototype.addPlant = function( t ){
	this.plants.push( new Plant( t, this ) );
};
omm.collectionUpdate( Garden, "addPlant" );

Garden.prototype.growPlants = function(){
	this.plants.forEach( function(p){
		p.grow();
	});
};
omm.collectionUpdate( Garden, "growPlants" );