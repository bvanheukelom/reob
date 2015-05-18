/**
 * Created by bert on 07.05.15.
 */

///<reference path="references.d.ts"/>
module Tests
{
    @mapper.Entity
    export class TestLeaf
    {
        _id:string;
        greenNess:number;

        @mapper.Type("TestTree")
        @mapper.AsForeignKey
        parent:TestTree;

        constructor(id?:string, parent?:Tests.TestTree)
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

        getTree():Tests.TestTree
        {
            return this.parent;
        }
    }
}