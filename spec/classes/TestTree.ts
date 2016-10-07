import * as omm from "../../src/omm"
import * as Tests from "./Tests"

@omm.Entity 
export class TestTree {
    @omm.Id
    treeId:string;
    private height:number = 10;
    someArray:Array<any> = [];
    creationDate:Date;
    someBoolean:boolean = false;

    @omm.ArrayType("TestLeaf")
    @omm.DocumentName('thoseGreenThings')
    leaves:Array<Tests.TestLeaf> = [];

    @omm.Type("TestAddress")
    // @omm.AsForeignKey
    address:Tests.TestAddress; // this cant be stored as the address doesnt have a foreign key

    constructor( initialHeight?:number) {
        this.height = initialHeight || 10;
        this.creationDate = new Date();
    }

    @omm.RemoteCollectionUpdate
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

    @omm.CollectionUpdate
    growAsOnlyACollectionUpdate():string {
        return this._grow();
    }

    @omm.RemoteCollectionUpdate
    wither() {
        this.leaves = [];
        omm.emit("gardenevents", "withered");
        omm.emit("gardenevents", "withered2");
    }

    @omm.RemoteCollectionUpdate
    thisThrowsAnError() {
        throw new Error("Hello world");
    }

    getHeight():number {
        return this.height;
    }

    getLeaves():Array<Tests.TestLeaf> {
        return this.leaves;
    }

    @omm.CollectionUpdate
    setSomeBooleanTo( f:boolean ){
        this.someBoolean = f;
    }
    
    @omm.CollectionUpdate
    @omm.Remote({replaceWithCall:true, resultType:"TestLeaf"})
    growAndReturnLeaves():Array<Tests.TestLeaf>{
        this.grow();
        return this.leaves;
    }
}
