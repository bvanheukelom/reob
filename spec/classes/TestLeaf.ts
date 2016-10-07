/**
 * Created by bert on 07.05.15.
 */

import * as omm from "../../src/omm"
import {TestTree} from "./TestTree"

@omm.Entity
export class TestLeaf
{
    _id:string;
    @omm.DocumentName("greenIndex")
    greenNess:number;

    @omm.Parent
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

    @omm.RemoteCollectionUpdate
    flutter(){
        this.greenNess++;
        omm.emit("fluttering");
    }
}