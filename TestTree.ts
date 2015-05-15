/**
 * Created by bert on 04.05.15.
 */
module Tests
{
    @persistence.PersistenceAnnotation.Entity("TheTreeCollection")
    export class TestTree {
        private _id:string;
        private height:number = 10;

        @persistence.PersistenceAnnotation.ArrayOrMap("TestLeaf")
        leaves:Array<TestLeaf> = [];

        constructor( initialHeight?:number) {
            this.height = initialHeight || 10;
        }

        @persistence.PersistenceAnnotation.Wrap

        grow():string {
            this.height++;
            console.log("Tree is growing to new heights: ", this.height);
            this.leaves.push(new Tests.TestLeaf("leaf" + this.getHeight(), this));
            this.leaves.forEach(function (l:Tests.TestLeaf) {
                l.grow();
            });
            if( Meteor.isClient )
                return "grown on the client";
            else
                return "grown on the server";
        }

        @persistence.PersistenceAnnotation.Wrap
        wither()
        {
            this.leaves = [];
        }

        getId():string {
            return this._id;
        }
        setId(i:string)
        {
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