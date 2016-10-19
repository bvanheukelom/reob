/**
 * Created by bert on 13.05.15.
 */

import * as reob from "../../src/reob"
import {Collection} from "../../src/Collection"
import * as Tests from "./Tests"

export class TestTreeCollection extends Collection<Tests.TestTree> {

    constructor( ) {
        super( Tests.TestTree,"TheTreeCollection");
    }

    @reob.Remote({ serverOnly:true })
    newTree(initialHeight:number):Promise<Tests.TestTree> {
        var t:Tests.TestTree = new Tests.TestTree(initialHeight);
        return this.insert(t).then((id:string)=>{
             return t;
        });
    }

    @reob.Remote({  replaceWithCall:true, serverOnly:true, parameterTypes:["number","callback"]})
    errorMethod(initialHeight:number):Promise<any> {
        return Promise.reject("the error");
    }

    @reob.Remote({  replaceWithCall:true, parameterTypes:["string","callback"]})
    deleteTree(treeId:string):Promise<void> {
        return this.remove(treeId);
    }

    @reob.Remote({ parameterTypes:[ "string", "TestTree", "number" ] } )
    serverFunction( treeId:string, t:Tests.TestTree, n:number ) {
        return "Hello " + treeId+"!";
    }

    @reob.Remote({object:'TestTreeCollection', replaceWithCall:true, parameterTypes:["callback"]})
    removeAllTrees( ) : Promise<void> {
        return this.getMongoCollection().remove({});
    }

}



