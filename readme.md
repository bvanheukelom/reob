###Meteor object mapper

Omm helps to separate business logic from persistence and access logic in meteor projects. Through descriptive function
calls omm learns about the structure of the objects and is then able to do a lot of the grunt work like converting back and
forth between objects and documents or passing parameters from Meteor.call to Meteor.method and then to the domain function.

Benefits:

- Usually the structure of the object is convoluted with meteor update statemens Omm helps that the developer can write
cleaner domain objects.

- Omm helps to "find the right object". After iterating/selecting/iterating through the object graph, that 'lookup' needs to
be replicated on the server in order for that piece of object to be changed. Omm does that for the developer.

- Omm creates rich object graphs from the documents read from the collections.

- Omm helps to keep the schema intact because all database accesses is done via atomic updates. Updates are repeated if the
 underlying document has changed in the meantime.

- Meteor methods and their parameters are mapped onto class functions. This way the meteor method can expose that domain
 functionality and the developer does not need to write a lot of parameter-passing-code.

- Refactoring is easier

Here is an example that consists of two classes:

[Garden.js!](example/Garden.js)
```
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

[Plant.js!](example/Plant.js)
```

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



On restoration of a document

1) If the expected type has a static function "toObject", that function is used

2) If there is a "className" property on the document, it is used to instantiate the object

3) An object of the expected class is instantiated

4) The object created is filled with the properties found on the document.



