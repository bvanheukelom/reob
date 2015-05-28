/**
 * Created by bert on 04.05.15.
 */
module Tests
{
    @omm.Entity("TheTreeCollection")
    export class TestTree {
        private _id:string;
        private height:number = 10;

        @omm.ArrayOrMap("TestLeaf")
        leaves:Array<TestLeaf> = [];

        constructor( initialHeight?:number) {
            this.height = initialHeight || 10;
        }

        @omm.Wrap
        grow():string {
            this.height++;
            console.log("Tree is growing to new heights: ", this.height+" on the "+(Meteor.isServer?"server":"client"));
            this.leaves.push(new Tests.TestLeaf("leaf" + this.getHeight(), this));
            this.leaves.forEach(function (l:Tests.TestLeaf) {
                l.grow();
            });
            if( Meteor.isClient )
                return "grown on the client";
            else
                return "grown on the server";
        }

        @omm.Wrap
        wither()
        {
            this.leaves = [];
        }

        getId():string {
            return this._id;
        }
        setId(i:string)
        {
            console.log("Setting tree id:"+i)
            this._id = i;
        }

        getHeight():number {
            return this.height;
        }

        getLeaves():Array<Tests.TestLeaf> {
            return this.leaves;
        }
    }
}