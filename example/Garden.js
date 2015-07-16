Garden = function Garden( name, id ){
	this._id = id;
	this.name = name;
	this.plants = [];
	this.harvested = 0;
};

Garden.prototype.addPlant = function( t ){
	this.plants.push( new Plant( t, this ) );
};

Garden.prototype.growPlants = function(){
	this.plants.forEach( function(p){
		p.grow();
	});
};

// declares Garden as an Entity
omm.addEntity(Garden);

omm.collectionUpdate( Garden, "growPlants" );
omm.collectionUpdate( Garden, "addPlant" );

// declares that the property "plants" contains objects of the type "Plant"
omm.arrayType(Garden, "plants", "Plant");
