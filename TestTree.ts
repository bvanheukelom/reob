/**
 * Created by bert on 04.05.15.
 */
import PersistenceAnnotation = require( "./PersistenceAnnotation" );
import TestLeaf = require("./TestLeaf");

@PersistenceAnnotation.Entity("TestTree")
class TestTree
{
    private _id:string;
    private height:number=10;

    @PersistenceAnnotation.ArrayOrMap("TestLeaf")
    private leaves:Array<TestLeaf> = [];

    constructor( id?:string )
    {
        this._id = id;
    }

    @PersistenceAnnotation.Wrap
    grow():void
    {
        this.height++;
        console.log("Tree is growing to new heights: ", this.height);
        this.leaves.push( new TestLeaf( "leaf"+this.getHeight(), this) );
        this.leaves.forEach(function(l:TestLeaf)
        {
            l.grow();
        });
    }

    getId():string
    {
        return this._id;
    }

    getHeight():number
    {
        return this.height;
    }

    getLeaves():Array<TestLeaf>
    {
        return this.leaves;
    }
}
export = TestTree