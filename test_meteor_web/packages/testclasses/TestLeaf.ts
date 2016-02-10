/**
 * Created by bert on 07.05.15.
 */

///<reference path="./references.d.ts"/>
module Tests
{
    @omm.Entity
    export class TestLeaf
    {
        _id:string;
        @omm.DocumentName("greenIndex")
        greenNess:number;

        @omm.Parent
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

        @omm.Wrap
        flutter(){
            this.greenNess++;
            omm.emit("fluttering");
        }
    }
}