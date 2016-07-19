/**
 * Created by bert on 13.05.15.
 */

import * as omm from "../../src/omm"
import * as Tests from "./Tests"

export class TestTreeCollection extends omm.Collection<Tests.TestTree> {

    constructor( db?:any ) {
        super( db, Tests.TestTree,"TheTreeCollection");
    }

    @omm.MeteorMethod({ serverOnly:true })
    newTree(initialHeight:number):Promise<Tests.TestTree> {
        var t:Tests.TestTree = new Tests.TestTree(initialHeight);
        return this.insert(t).then((id:string)=>{
             return t;
        });
    }

    @omm.MeteorMethod({  replaceWithCall:true, serverOnly:true, parameterTypes:["number","callback"]})
    errorMethod(initialHeight:number):Promise<any> {
        return Promise.reject("the error");
    }

    @omm.MeteorMethod({  replaceWithCall:true, parameterTypes:["string","callback"]})
    deleteTree(treeId:string):Promise<void> {
        return this.remove(treeId);
    }

    @omm.MeteorMethod({ parameterTypes:[ "string", "TestTree", "number" ] } )
    serverFunction( treeId:string, t:Tests.TestTree, n:number ) {
        return "Hello " + treeId+"!";
    }

    @omm.MeteorMethod({object:'TestTreeCollection', replaceWithCall:true, parameterTypes:["callback"]})
    removeAllTrees( ) : Promise<void> {
        return this.getMongoCollection().remove({});
    }

}



