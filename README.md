# Reob - Remote objects

Create backends for one page web apps with ease. Uses mongo and express.

[![NPM version](https://badge.fury.io/js/reob.svg)](http://badge.fury.io/js/reob.svg)

Reob helps to create backends for one page web apps. It combines object mapping, networking and a
webserver. You write domain object classes and service classes and use them from the client. You can call functions on an
object that causes an http request to the server which loads the object there, invokes the function on it, updates the
database with the changes to the object and transmits the result of the function back to the client.

It is written in typescript and makes heavy use of decorators.

## Installation

Reob is available as an NPM package. You can install it
in your project's directory as usual:

```bash
$ npm install reob --save
```

## Usage

In order to get an overview of how reob works let's look at an example. Imagine you want to write a tool for a club of
garden owners.

### Step 1: Create domain objects

In our example we create two classes. Garden and Plant. A garden that has an array of plants.

Here is the simple class `Plant` which will be used as part of a garden.

[Plant.ts](example/Plant.ts)
```ts
import * as reob from "reob"

@reob.Entity
export class Plant{

	height:number = 1;

	type:string;

	constructor( theType:string ){
		this.type = theType;
	}

	@reob.RemoteCollectionUpdate
	grow( n:number ){
		this.height += n;
	}

}
```

This class contains two decorators. `@reob.Entity` let's reob know that it is an entity. An Entity is a term used in
datamodelling that describes something that is separated from other things, has data and behaviour. The term is a bit
unwieldy. It boils down to: Entities are the data-things that matter in a project.

Entities can be saved and loaded from the database and transmitted over the network.

`@reob.RemoteCollectionUpdate` combines the core features of reob and we'll get to it later. So much for now: It allows you
 to call the function from the server through the server and the changes made on the object are persisted into the database.

[Garden.ts](example/Garden.js)
```ts
import * as reob from "reob"
import {Plant} from "./Plant"

@reob.Entity
export class Garden{

	_id:string;

	bees:number;

	@reob.ArrayType("Plant")
	plants:Array<Plant> = [ new Plant( "Rose") ];

	constructor( initialBeeCount:number ){
		this.bees = initialBees;
	}
```

The decorator `@reob.ArrayType` tells reob what type of objects the array contains. Omm can now save and load Gardens from the mongo
database and transmit them over the network and the objects inside the `plants` array will be instances of `Plant`.

### Step 2: Setup the Collection

Now that we've created the domain objects, it is time to think about how they are loaded and saved to the mongo
collection.

[GardenCollection.ts](example/GardenCollection.ts)
```ts
import * as reob from "reob"
import {Garden} from "./Garden"

export class GardenCollection extends Collection<Garden>{

	constructor(){
		super( Garden, 'gardens' ); // 'gardens' is the name of the collection in the mongo db
	}

}
```

The class is a representation of the mongo collection that adds the reob behaviour on top of it. The original mongo collection
can be accessed using `getMongoCollection()`.


### Step 3: Write a service

This class deals with all things related to the garden that are not internal to the garden. There is one class for the
client and one for the server. The client version is just a stub to call the functions on. Omm monkey patches the
functions and routes them to the server. This is mostly needed to keep tools like browserify from including i.E mongo in
the bundle that is used on the client.

[GardenService.ts](example/GardenService.ts)
```ts
import * as reob from "reob"
import {GardenCollection} from "./GardenCollection"
import {Garden} from "./Garden"

export class GardenService{

	constructor(){
	}

	@reob.Remote
	countPlants(bees:number):Promise<number>{
		return undefined; // never called
	}

	@reob.Remote
	createGarden( initialBees:number ):Promise<string>{
		return undefined; // replaced with result from the server
	}

	@reob.Remote
    getGarden(id:string):Promise<Garden>{
        return undefined; // replaced with result from the server
    }

}
```
The version of the service that's used on the server. It contains the implementations of the functions.

[GardenServiceServer.ts](example/GardenServiceServer.ts)
```ts
import * as reob from "reob"
import {GardenCollection} from "./GardenCollection"
import {Garden} from "./Garden"

export class GardenServiceServer{

	constructor( private gardenCollection:GardenCollection){
	}

	@reob.Remote
	countPlants(bees:number):Promise<number>{

		return this.gardenCollection.find({
			"bees" : bees
		}).then( (gardens:Array<Garden>) => {
			var sum = 0;
			gardens.forEach((g:Garden)=>{
				sum += g.plants.length;
			});
			return sum;
        });
	}

	@reob.Remote
	createGarden( initialBees:number ):Promise<string>{
		var g:Garden = new Garden( initialBees );
		return this.gardenCollection.insert(garden);
	}

	@reob.Remote
	getGardens():Promise<Array<Garden>>{
		return this.gardenCollection.getAll(); // this should be limited in the real world
	}

	@reob.Remote
	getGarden( id:string ):Promise<Garden>{
		return this.gardenCollection.getByIdOrFail( id );
	}

}
```

The `@reob.Remote` decorator tells reob that the functions can be called from the client.

### Step 4: The server

This far we've not written a single line of code that concerns itself too much with network or database access.
Let's keep it that way. This is the file that is run in the node server.

[main_server.ts](example/main_server.ts)
```ts
import {Server} from "reob/server"
import {GardenCollection} from "./GardenCollection"
import {GardenServiceServer} from "./GardenServiceServer"

var server = new Server("mongodb://localhost/test");

var gardenCollection = new GardenCollection();
server.addCollection( gardenCollection );

var gardenServiceServer = new GardenServiceServer( gardenCollection );
server.addService( "gardenService", gardenServiceServer );

server.serveStatic("./webroot");

server.start(8080).then(()=>{
	console.log("Server is running");
});
```

### Step 5: Client startup

Use your tool of choice to convert the client creobonjs module to code that runs on the client.

[main_client.ts](example/main_client.ts)
```ts
import * as reob from "reob"
import {GardenService} from "./GardenService"

var client = new reob.Client(window.location.origin, 8080);
var gardenService = new GardenService();
client.addService( "gardenService", gardenServie );

window.gardenService = gardenService;
```

### index html

(This part of the documentation is work in progress)

[webroot/index.html](example/webroot/main_client.ts)
```html
<html>
	<head>
		<!-- load bundled javascript based on main_client.ts here -->
	</head>
	<body>
		<span id="result"></span>
		<hr/>
		<button id="createGarden">Create Garden</button>
		<button id="grow">grow Plant</button>
		<!-- hook up buttons to javascript. use jquery. -->
	</body>
<html>
```


## Key features

- Perform collection altering operations anywhere on the object graph

- Strengthens encapsulation of objects by removing persistence logic from the domain logic

- Atomicity over complex operations within one document

- Client & Server components that bring mongo collection access to the client

### Annotations

#### On a class

[@Entity](globals.html#entity)

#### On properties

[@Type](globals.html##type)

[@Parent](globals.html##parent)

[@DictionaryType](globals.html##dictionarytype)

[@ArrayType](globals.html##arraytype)

[@ArrayOrMap](globals.html##arrayormap)

[@Id](globals.html##parent)

[@Ignore](globals.html##ignore)

[@PriateToServer](globals.html##privatetoserver)

[@DocumentName](globals.html##documentname)

#### On functions

[@RemoteCollectionUpdate](globals.html##remotecollectionupdate)

[@CollectionUpdate](globals.html##collectionupdate)

[@Remote](globals.html##remote)

[@Wrap](globals.html##wrap)


## License

... still need to figure out what the most fitting license is. Any suggestions? Open an issue!

