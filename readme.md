### Object mapper (for) Meteor

Omm maps between rich objects and documents.

## Key features

- Load rich objects from a collection

- Describe the object graph through annotation-style function calls

- Declare meteor methods through annotations-style function calls

- Perform collection altering operations anywhere on the object graph

- Strengthens encapsulation of objects by removing persistence logic from the domain objects

- Atomicity over complex operations within one document

## Api Documentation

[JsDoc](https://bvanheukelom.github.io/omm/test_meteor_web/packages/omm/out/omm.html)

## Example

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

## Typescript annotations

// class annotation
@omm.Entity
@omm.Entity('<collectionName>')

// property annotations
@omm.Parent - not stored in the database, contains reference to the parent object. This is only useful if the object is not a root object.
@omm.Type('<typeClassName>') - declare the type of the property
@omm.ArrayOrMap('<typeClassName>')
@omm.AsForeignKey - the value of the property is an object and it is not going to be stored as the object itself but as a string-key
@omm.AsForeignKeys - same as above to be used with arrays/maps
@omm.Id - this is mapped to the _id property in mongo
@omm.DocumentName('<propertyNameInTheDatabase>') -- the property is stored in the database with a different name

// function annotations
@omm.Wrap - short for collection update + meteor method with replaceWithCall:true
@omm.CollectionUpdate
@omm.MeteorMethod(options)
	options:
		replaceWithCall:true
		parameterTypes:Array<string>
		object:stringIdentifier (referrs to a registered object)

@omm.StaticMeteorMethod ?

omm.registerObject(stringIdentifier, object);

## License

MIT



