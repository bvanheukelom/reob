
Plant = function Plant( type, garden ){
	//this._id = "id"+garden.plants.length;
	this.type = type;
	this.height = 1;
	this.garden = garden;
};

Plant.prototype.grow = function(){
	if( this.height<20 )
		this.height++;
	if( this.height==10 || this.height==15 ){
		this.garden.addPlant(this.type,this.garden);
	}
};

Plant.prototype.harvest = function(){
	var i = this.garden.plants.indexOf(this);
	this.garden.plants.splice(i,1);
	this.garden.harvested+=this.height;
};

// declares that Plant is an Entity
omm.addEntity(Plant);

// declares that the property garden contains object of the class "Garden"
omm.type(Plant, "garden", "Garden");

// declares that the value of the property should be stored as a key (string) rather than the actual object
omm.asForeignKey(Plant, "garden");

// declares that the function "harvest" should also be invoked on the object in the collection.
omm.collectionUpdate( Plant, "harvest");