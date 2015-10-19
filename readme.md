# Object mapper (for) Meteor

Write 'plain old' javascript objects (even with circular references) and store them in Mongo.

Load objects and call functions on them which change the Database.

No need to write Meteor methods or think about object/document conversion. Focus on domain objects and the UI.

##Concepts

### Annotation style

Omm does not require domain objects to have a specific base class or use proprietary getters/setters. Instead developers
 describe the structure of their domain objects using Omm's annotation style API.

###Entity

An entity is a javascript class that has properties and methods. Entities can have references to other entities. Methods
that manipulate the properties can receive entities as parameters and return entities as a result.

###Object <=> Document conversion

Omm converts an object graph into JSON documents and documents back into objects. This allows it to load and save objects from and to collections.

###Updating a collection

Omm attaches a version number to each objects state (document). Also see [the mongo db documentation](http://docs.mongodb.org/manual/tutorial/update-if-current/).

Steps to update an object in a collection:

 -  Load Object
 -  Run function with parameters on the object
 -  Increase the version number
 -  Store object if the version in the collection has not changed.

###Meteor methods

Omm can create meteor methods for functions on entities. You can load an object on the client and call a function on it.
Omm will make a meteor method call with the given parameters instead.





###Api doc


todo:create full javascript api link that has all js method calls in it

todo:create full typescript api link that has all d.ts method calls in it


###Example

Explain the structure of the example using a simplified class definition (just plain text) and write a couple of things
about it. also deploy it to meteor.com and link that. then connect that with links to the files in the examples folder.

garde -> plants

Person

Garden
	plants
	plantAPlant()

plants
   water
   height
   garden:Garden

	giveWater()
	harvest();


###Installation

```
meteor add bertundmax:omm
```




/*
## Api Documentation

[JsDoc](https://bvanheukelom.github.io/omm/test_meteor_web/packages/omm/out/omm.html)

###Declare entities and describe the object relations

Let's say you wrote a class called 'Garden' then this is how you let Omm know about it's existence.

```js
omm.addEntity(Garden, 'Garden'); // the name is necessary in case you want to minify the code
```

Declare the type of a property. This is only needed for other entities.

```js
omm.type( Garden, 'gardener', 'Person' );
```

Declare the type of the values of an array.

```js
omm.arrayType( Garden, 'plants', 'Plant' );
```

Declare the type of the values of a dictionary.

```js
omm.dictionaryType( Garden, 'plantsByName', 'Plant' );
```

If a referenced object is stored in a different collection declare it as a forein key.

```js
omm.asForeignKey(Garden, "gardener");
```

If you're using a different property in your object than in the document, this is how you can specify that:

```js
omm.id(Garden, 'gardenId' );
```

Tell om to use a different name for a property in the database than on the object:

```js
omm.documentName(Garden, 'harvested', 'harvestCount' );
```

###Collection updates and meteor methods

Tell omm to replace a function ith a collection update
```js
omm.collectionUpdate( Garden, "growPlants" );
```

```js
omm.meteorMethod(Garden, "growPlants", options);
```

	options:
		replaceWithCall:true
		parameterTypes:Array<string>
		object:stringIdentifier (referrs to a registered object)


###Meteor methods
@omm.wrap - short for collection update + meteor method with replaceWithCall:true

@omm.MeteorMethod(options)
	options:
		replaceWithCall:true
		parameterTypes:Array<string>
		object:stringIdentifier (referrs to a registered object)


Complete files for the domain classes:
[Garden.js](example/Garden.js) [Person.js](example/Person.js) [Plant.js](example/Plant.js)



## Typescript annotations
```ts
// class annotation
@omm.Entity('<name>')
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
```
*/

## License

MIT



