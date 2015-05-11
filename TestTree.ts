/**
 * Created by bert on 04.05.15.
 */

@persistence.PersistenceAnnotation.Entity("TestTree")
class TestTree
{
    private _id:string;
    private height:number=10;

    @persistence.PersistenceAnnotation.ArrayOrMap("TestLeaf")
    private leaves:Array<TestLeaf> = [];

    constructor( id?:string )
    {
        this._id = id;
    }

    @persistence.PersistenceAnnotation.Wrap
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