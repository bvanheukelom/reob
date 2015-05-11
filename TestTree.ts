/**
 * Created by bert on 04.05.15.
 */
module Tests
{
    @persistence.PersistenceAnnotation.Entity("TestTree")
    export class TestTree {
        private _id:string;
        private height:number = 10;

        @persistence
    .
        PersistenceAnnotation
    .
        ArrayOrMap(

        "TestLeaf"
    )
        private leaves:Array<TestLeaf> = [];

        constructor(id?:string) {
            this._id = id;
        }

        @persistence
    .
        PersistenceAnnotation
    .
        Wrap

        grow():void {
            this.height++;
            console.log("Tree is growing to new heights: ", this.height);
            this.leaves.push(new Tests.TestLeaf("leaf" + this.getHeight(), this));
            this.leaves.forEach(function (l:Tests.TestLeaf) {
                l.grow();
            });
        }

        getId():string {
            return this._id;
        }

        getHeight():number {
            return this.height;
        }

        getLeaves():Array<Tests.TestLeaf> {
            return this.leaves;
        }
    }
}