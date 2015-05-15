/**
 * Created by bert on 13.05.15.
 */
///<reference path="references.d.ts"/>

class TestTreeCollection extends persistence.BaseCollection<Tests.TestTree> {
    constructor()
    {
        super(Tests.TestTree);
    }

    newTree( initialHeight:number, callback:(err:any, tree?:Tests.TestTree)=>void){
        var that = this;
        this.insert( new Tests.TestTree(initialHeight) );
    }
    deleteTree( treeId:string ){
        this.remove( treeId );
    }

}

// TODO move to annotation
persistence.MeteorPersistence.wrapFunction(TestTreeCollection.prototype, "newTree", "newTree", true, null, new ConstantObjectRetriever(new TestTreeCollection()) );
persistence.MeteorPersistence.wrapFunction(TestTreeCollection.prototype, "deleteTree", "deleteTree", true, null, new ConstantObjectRetriever(new TestTreeCollection()) );