###Meteor object mapper

Omm helps to separate business logic from persistence and access logic in meteor projects. Through descriptive function
calls omm learns about the structure of the objects and is then able to do a lot of the grunt work like converting back and
forth between objects and documents or passing parameters from Meteor.call to Meteor.method and then to the domain function.

Key features:

- Load rich objects instead of documents from a collection

- Describe the object graph through annotation-style function calls

- Declare meteor methods through annotations-style function calls

- Perform collection altering operations anywhere on the object graph.

- Strengthens encapsulation of objects by removing persistence logic from the domain logic.

- Atomicity over complex operations (within one document)

##Example

[Garden.js](example/Garden.js)
```js
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
```

[Plant.js](example/Plant.js)
```js
Plant = function Plant( type, garden ){
	//this._id = "id"+garden.plants.length;
	this.type = type;
	this.height = 1;
	this.garden = garden;
};
// declares that Plant is an Entity
omm.addEntity(Plant);
// declares that the property garden contains object of the class "Garden"
omm.type(Plant, "garden", "Garden");
// declares that the value of the property should be stored as a key (string) rather than the actual object
omm.asForeignKey(Plant, "garden");


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
// declares that the function "harvest" should also be invoked on the object in the collection.
omm.collectionUpdate( Plant, "harvest");

```




