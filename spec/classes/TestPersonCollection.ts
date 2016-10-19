
import * as reob from "../../src/reob"
import {Collection} from "../../src/Collection"

import * as Tests from "./Tests"
import * as mongodb from "mongodb"

export class TestPersonCollection extends Collection<Tests.TestPerson> {

    constructor( ) {
        super( Tests.TestPerson );
    }

    @reob.Remote({ serverOnly:true, parameterTypes:["string","callback"]})
    newPerson(n:string):Promise<Tests.TestPerson> {
        var p:Tests.TestPerson = new Tests.TestPerson();
        p.name = n;
        return this.insert(p).then((id:string)=>{
            return this.getById(id);
        });
    }

    @reob.Remote({ parameterTypes:["TestPerson", "TestPerson", "callback"]})
    haveBaby( mom:Tests.TestPerson, dad:Tests.TestPerson ):Promise<Tests.TestPerson> {
        //console.log("mom: ", mom);
        //console.log("dad: ", dad);
        var kid:Tests.TestPerson = new Tests.TestPerson();
        kid.name = "child of " + mom.name + " and " + dad.name;
        kid.family["mom"] = mom;
        kid.family["dad"] = dad;
        return this.insert(kid).then((id:string)=>{
            return this.getById(id);
        });
    }

    @reob.Remote({ serverOnly:true, parameterTypes:["string", "callback"]})
    removePerson( id:string ) : Promise<void> {
        return this.remove(id);
    }

    @reob.Remote({ serverOnly:true, parameterTypes:["callback"]})
    removeAllPersons() : Promise<void> {
        return this.getMongoCollection().remove({});
    }

}