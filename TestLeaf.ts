/**
 * Created by bert on 07.05.15.
 */

///<reference path="references.d.ts"/>

@persistence.PersistenceAnnotation.Entity
class TestLeaf
{
    _id:string;
    greenNess:number;

    @persistence.PersistenceAnnotation.Type("TestTree")
    @persistence.PersistenceAnnotation.AsForeignKey
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
}