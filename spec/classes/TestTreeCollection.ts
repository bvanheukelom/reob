/**
 * Created by bert on 13.05.15.
 */

import * as omm from "../../src/omm"
import * as Tests from "./Tests"

export class TestTreeCollection extends omm.Collection<Tests.TestTree> {

    constructor( ) {
        super( Tests.TestTree,"TheTreeCollection");
    }

    @omm.Remote({ serverOnly:true })
    newTree(initialHeight:number):Promise<Tests.TestTree> {
        var t:Tests.TestTree = new Tests.TestTree(initialHeight);
        return this.insert(t).then((id:string)=>{
             return t;
        });
    }

    @omm.Remote({  replaceWithCall:true, serverOnly:true, parameterTypes:["number","callback"]})
    errorMethod(initialHeight:number):Promise<any> {
        return Promise.reject("the error");
    }

    @omm.Remote({  replaceWithCall:true, parameterTypes:["string","callback"]})
    deleteTree(treeId:string):Promise<void> {
        return this.remove(treeId);
    }

    @omm.Remote({ parameterTypes:[ "string", "TestTree", "number" ] } )
    serverFunction( treeId:string, t:Tests.TestTree, n:number ) {
        return "Hello " + treeId+"!";
    }

    @omm.Remote({object:'TestTreeCollection', replaceWithCall:true, parameterTypes:["callback"]})
    removeAllTrees( ) : Promise<void> {
        return this.getMongoCollection().remove({});
    }

}



