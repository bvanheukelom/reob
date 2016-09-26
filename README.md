### omm, a relaxed object mapper for mongodb

Omm maps between rich objects and documents.

## Key features

- Describe the object graph through annotations

- Declare server methods through annotations

- Perform collection altering operations anywhere on the object graph

- Strengthens encapsulation of objects by removing persistence logic from the domain logic

- Atomicity over complex operations within one document

- Client & Server components that bring mongo collection access to the client

## Annotations

[@Entity](globals.html#entity)

[@Type](globals.html##type)

[@Parent](globals.html##parent)

[@Id](globals.html##parent)

[@DocumentName](globals.html##documentname)

[@CollectionUpdate](globals.html##collectionupdate)

[@Wrap](globals.html##wrap)


## Example

[Garden.ts](example/Garden.js)
```ts
import {Entity, CollectionUpdate, Parent} from "@bvanheukelom/o-m-m"
import {Plant} from "./Plant"

@omm.Entity
export class Garden{

	_id:string;

	@ArrayType("Plant")
	plants:Array<Plant> = [ new Plant( "Rose") ];

	constructor( ){
	}

	@CollectionUpdate
	growPlants(){
	    this.plants.forEach( function(p){
	        p.grow();
	    });
	}

}
```

[Plant.ts](example/Plant.ts)
```ts

export class Plant{
	this.height = 1;

	@Parent
	garden:Garden;

	constructor( public type:string ){
	}


	grow(){
    	if( this.height<20 )
    		this.height++;
    	if( this.height==10 || this.height==15 ){
    		this.garden.addPlant(this.type,this.garden);
    	}
    }

    @CollectionUpdate
    harvest(){
    	var i = this.garden.plants.indexOf(this);
    	this.garden.plants.splice(i,1);
    	this.garden.harvested+=this.height;
    }

}


```

## License

MIT



