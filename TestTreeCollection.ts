/**
 * Created by bert on 13.05.15.
 */
///<reference path="references.d.ts"/>

class TestTreeCollection extends mapper.BaseCollection<Tests.TestTree> {
    constructor()
    {
        super(Tests.TestTree);
    }

    newTree( initialHeight:number, callback:(err:any, tree?:Tests.TestTree)=>void):void{
        var t:Tests.TestTree  = new Tests.TestTree(initialHeight);
        try{
            var id:string = this.insert( t );
            callback( undefined, this.getById(id) );
        }catch( err )
        {
            callback( err );
        }
    }
    deleteTree( treeId:string, cb:(err:any)=>void ){
        this.remove( treeId, cb );
    }
    serverFunction( treeId:string, t:Tests.TestTree, n:number, cb:(e:any, r:string)=>void ){
        cb( undefined, "Hello "+treeId+"! This is on the "+(Meteor.isServer?"server":"client")+" t:"+(t instanceof Tests.TestTree)+" "+t.getHeight()+" n:"+n+" "+(typeof n) );
    }

}

if( Meteor.isServer ) {
    Meteor.publish("trees", function(){
        return mapper.MeteorPersistence.collections["TheTreeCollection"].getMeteorCollection().find({});
    });
}
else
{
    Meteor.subscribe("trees");
}
// TODO move to annotation

mapper.MeteorPersistence.wrapFunction(TestTreeCollection.prototype, "newTree", "newTree", true, new DeSerializer.Serializer(new mapper.MeteorObjectRetriever()), new mapper.ConstantObjectRetriever(new TestTreeCollection()) );
mapper.MeteorPersistence.wrapFunction(TestTreeCollection.prototype, "deleteTree", "deleteTree", true, new DeSerializer.Serializer(new mapper.MeteorObjectRetriever()), new mapper.ConstantObjectRetriever(new TestTreeCollection()) );
mapper.MeteorPersistence.wrapFunction(TestTreeCollection.prototype, "serverFunction", "serverFunction", true, new DeSerializer.Serializer(new mapper.MeteorObjectRetriever()), new mapper.ConstantObjectRetriever(new TestTreeCollection()) );