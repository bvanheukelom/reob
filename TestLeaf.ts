/**
 * Created by bert on 07.05.15.
 */

import PersistenceAnnotation = require( "./PersistenceAnnotation" );
import TestTree = require( "./TestTree" );



class TestLeaf
{
    _id:string;
    greenNess:number;

    @PersistenceAnnotation.Type("TestTree")
    @PersistenceAnnotation.AsForeignKey
    parent:TestTree;

    constructor(id:string, parent:TestTree)
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
}
export = TestLeaf;