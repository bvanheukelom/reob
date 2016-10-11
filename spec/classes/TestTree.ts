import * as reob from "../../src/reob"
import * as Tests from "./Tests"

@reob.Entity
export class TestTree {
    @reob.Id
    treeId:string;
    private height:number = 10;
    someArray:Array<any> = [];
    creationDate:Date;
    someBoolean:boolean = false;

    @reob.ArrayType("TestLeaf")
    @reob.DocumentName('thoseGreenThings')
    leaves:Array<Tests.TestLeaf> = [];

    @reob.Type("TestAddress")
    // @omm.AsForeignKey
    address:Tests.TestAddress; // this cant be stored as the address doesnt have a foreign key

    constructor( initialHeight?:number) {
        this.height = initialHeight || 10;
        this.creationDate = new Date();
    }

    @reob.RemoteCollectionUpdate
    grow():string {
        return this._grow();
    }

    _grow():string {
        this.height++;
        //console.log("Tree is growing to new heights: ", this.height+" on the "+(omm.getMeteor().isServer?"server":"client"));
        debugger;
        this.leaves.push(new Tests.TestLeaf("leaf" + this.getHeight(), this));
        this.leaves.forEach(function (l:Tests.TestLeaf) {
            l.grow();
        });
        return "grown!";
    }

    @reob.CollectionUpdate
    growAsOnlyACollectionUpdate():string {
        return this._grow();
    }

    @reob.RemoteCollectionUpdate
    wither() {
        this.leaves = [];
        reob.emit("gardenevents", "withered");
        reob.emit("gardenevents", "withered2");
    }

    @reob.RemoteCollectionUpdate
    thisThrowsAnError() {
        throw new Error("Hello world");
    }

    getHeight():number {
        return this.height;
    }

    getLeaves():Array<Tests.TestLeaf> {
        return this.leaves;
    }

    @reob.CollectionUpdate
    setSomeBooleanTo( f:boolean ){
        this.someBoolean = f;
    }
    
    @reob.CollectionUpdate
    @reob.Remote({replaceWithCall:true, resultType:"TestLeaf"})
    growAndReturnLeaves():Array<Tests.TestLeaf>{
        this.grow();
        return this.leaves;
    }
}
