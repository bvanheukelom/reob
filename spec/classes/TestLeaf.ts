/**
 * Created by bert on 07.05.15.
 */

import * as reob from "../../src/reob"
import {TestTree} from "./TestTree"

@reob.Entity
export class TestLeaf
{
    _id:string;
    @reob.DocumentName("greenIndex")
    greenNess:number;

    @reob.Parent
    parent:TestTree;

    constructor(id?:string, parent?:TestTree)
    {
        this._id = id;
        this.greenNess = 1;
        this.parent = parent;
    }

    getId():string
    {
        return this._id;
    }

    grow():void
    {
        this.greenNess++;
    }

    getTree():TestTree
    {
        return this.parent;
    }

    @reob.RemoteCollectionUpdate
    flutter(){
        this.greenNess++;
        reob.emit("fluttering");
    }


    @reob.CollectionUpdate
    doACollectionUpdate():number{
        this.greenNess++;
        console.log('leave grown to ', this.greenNess);
        return 5;
    }
}