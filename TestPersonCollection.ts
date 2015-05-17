///<reference path="references.d.ts"/>
class TestPersonCollection extends persistence.BaseCollection<Tests.TestPerson>
{
    constructor()
    {
        super(Tests.TestPerson);
    }
    newPerson( n:string, callback:(err:any, tree?:Tests.TestPerson)=>void):void{
        var p:Tests.TestPerson  = new Tests.TestPerson();
        p.name = n;
        try{
            var id:string = this.insert( p );
            if( !this.getById(id) )
                throw new Error("Could not insert person.");
            callback( undefined, this.getById(id) );
        }catch(e){
            callback( e );
        }

    }

}

if( Meteor.isServer ) {
    Meteor.publish("persons", function(){
        return persistence.MeteorPersistence.collections["TestPerson"].getMeteorCollection().find({});
    });
}
else
{
    Meteor.subscribe("persons");
}

persistence.MeteorPersistence.wrapFunction(TestPersonCollection.prototype, "newPerson", "newPerson", true, new DeSerializer.Serializer(new persistence.MeteorObjectRetriever()), new persistence.ConstantObjectRetriever(new TestPersonCollection()) );
