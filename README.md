## omm

Create backends for one page web apps with ease. Uses mongo and express.

Omm is an opinionated framework to create backends for one page web apps. It combines object mapping, networking and a
webserver. You write domain objects and service classes and use them from the client. You can call functions on an
object that causes an http request to the server which loads the object there, invokes the function on it and transmits the
result back to the client. Omm takes care of the database and network specifics. It is written in typescript and makes
heavy use of decorators.

In order to get an overview of how omm works we're using an example. Imagine you want to write a management tool for
your club of garden owners.

### Step 1: Create domain objects

In our example we create two classes. Garden and Plant. A garden that has an array of plants.

Here is the simple class `Plant` which will be used as part of a garden.

[Plant.ts](example/Plant.ts)
```ts
import * as omm from "@bvanheukelom/o-m-m"

@omm.Entity
export class Plant{

	height:number = 1;

	type:string;

	constructor( theType:string ){
		this.type = theType;
	}

	@omm.RemoteCollectionUpdate
	grow( n:number ){
		this.height += n;
	}

}
```

This class contains two decorators. `@omm.Entity` let's omm know that it is an entity. An Entity is a term used in
datamodelling that describes something that is separated from other things, has data and behaviour. It can be saved and
loaded from the database and transmitted over the network.

`@omm.RemoteCollectionUpdate` combines the core features of omm and we'll get to it later. So much for now: It allows you
 to call the function from the server through the server and the changes made on the object are persisted into the database.

[Garden.ts](example/Garden.js)
```ts
import * as omm from "@bvanheukelom/o-m-m"
import {Plant} from "./Plant"

@omm.Entity
export class Garden{

	_id:string;

	bees:number;

	@omm.ArrayType("Plant")
	plants:Array<Plant> = [ new Plant( "Rose") ];

	constructor( initialBeeCount:number ){
		this.bees = initialBees;
	}

```

The decorator `@omm.ArrayType` tells omm what type of objects the array contains. Omm can now save and load Gardens from the mongo
database and transmit them over the network and the objects inside the `plants` array will be instances of `Plant`.

### Step 2: Setup the Collection

Now that we've created the domain objects, it is time to think about how they are loaded and saved to the mongo
collection.

[GardenCollection.ts](example/GardenCollection.ts)
```ts
import * as omm from "@bvanheukelom/o-m-m"
import {Garden} from "./Garden"

export class GardenCollection extends Collection<Garden>{

	constructor(){
		super( Garden, 'gardens' ); // 'gardens' is the name of the collection in the mongo db
	}

}
```

The class is a representation of the mongo collection that adds the omm behaviour on top of it. The original mongo collection
can be accessed using `getMongoCollection()`.


### Step 3: Write a service

This class deals with all things related to the garden that are not internal to the garden. There is one class for the
client and one for the server. The client version is just a stub to call the functions on. Omm monkey patches the
functions and routes them to the server. This is mostly needed to keep tools like browserify from including i.E mongo in
the bundle that is used on the client.

[GardenService.ts](example/GardenService.ts)
```ts
import * as omm from "@bvanheukelom/o-m-m"
import {GardenCollection} from "./GardenCollection"
import {Garden} from "./Garden"

export class GardenService{

	constructor(){
	}

	@Remote
	countPlants(bees:number):Promise<number>{
		return undefined; // never called
	}

	@Remote({name:"GardenService.createGarden")
	createGarden( initialBees:number ):Promise<string>{
		return undefined; // replaced with result from the server
	}

	@Remote({name:"GardenService.getGarden")
    getGarden(id:string):Promise<Garden>{
        return undefined; // replaced with result from the server
    }

}

```
The version of the service that's used on the server. It contains the implementations of the functions.

[GardenServiceServer.ts](example/GardenServiceServer.ts)
```ts

import * as omm from "@bvanheukelom/o-m-m"
import {GardenCollection} from "./GardenCollection"
import {Garden} from "./Garden"

export class GardenServiceServer{

	constructor( private gardenCollection:GardenCollection){
	}

	@Remote({name:"GardenService.countPlants")
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

	@Remote({name:"GardenService.createGarden"})
	createGarden( initialBees:number ):Promise<string>{
		var g:Garden = new Garden( initialBees );
		return this.gardenCollection.insert(garden);
	}

	@Remote({name:"GardenService.getGardens"})
	getGardens():Promise<Array<Garden>>{
		return this.gardenCollection.getAll(); // this should be limited in the real world
	}

	@Remote({name:"GardenService.getGarden"})
	getGarden( id:string ):Promise<Garden>{
		return this.gardenCollection.getByIdOrFail( id );
	}

}

```

The `@Remote` decorator tells omm that the functions can be called from the client.

### The server

This far we've not written a single line of code that concerns itself too much with network or database access.
Let's keep it that way. This is the file that is run in the node server.

[main_server.ts](example/main_server.ts)
```ts
import {Server} from "@bvanheukelom/o-m-m/dist/src/Server"
import {GardenCollection} from "./GardenCollection"
import {GardenServiceServer} from "./GardenServiceServer"

var server = new Server("mongodb://localhost/test");

var gardenCollection = new GardenCollection();
server.addCollection( gardenCollection );

var gardenServiceServer = new GardenServiceServer( gardenCollection );
server.addService( gardenServiceServer );

server.serveStatic("./webroot");

server.start(8080).then(()=>{
	console.log("Server is running");
});

```

### Client startup

Use your tool of choice to convert the client commonjs module to code that runs on the client.

[main_client.ts](example/main_client.ts)
```ts
import * as omm from "@bvanheukelom/o-m-m"
import {GardenService} from "./GardenService"

var client = new omm.Client(window.location.origin, 8080);
var gardenService = new GardenService();
client.addService( gardenServie );

window.gardenService = gardenService;

```

### index html

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

Not open source for now.

