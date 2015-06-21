///<reference path="./references.d.ts"/>
module Tests {
    export class TestPersonCollection extends omm.Collection<Tests.TestPerson> {
        constructor() {
            super(Tests.TestPerson);
        }

        @omm.MeteorMethod({object:'TestPersonCollection'})
        newPerson(n:string, callback:(err:any, tree?:Tests.TestPerson)=>void):void {
            var p:Tests.TestPerson = new Tests.TestPerson();
            p.name = n;
            var that = this;
            this.insert(p, function (e:any, id:string) {
                callback(e, id ? that.getById(id) : undefined);
            });
        }
        @omm.MeteorMethod({object:'TestPersonCollection'})
        insertPerson(n:string):Tests.TestPerson {
            var p:Tests.TestPerson = new Tests.TestPerson();
            p.name = n;
            var that = this;
            var id = this.insert(p);
            return this.getById(id);
        }

        @omm.StaticMeteorMethod
        static staticInsertPerson(n:string):Tests.TestPerson {
            var personCollection:Tests.TestPersonCollection = omm.getRegisteredObject("TestPersonCollection");
            var p:Tests.TestPerson = new Tests.TestPerson();
            p.name = n;
            var id = personCollection.insert(p);
            return personCollection.getById(id);
        }


        @omm.StaticMeteorMethod('helloWorld', {parameterTypes:['string']})
        static staticInsertPerson2(n:string):Tests.TestPerson {
            var personCollection:Tests.TestPersonCollection = omm.getRegisteredObject("TestPersonCollection");
            var p:Tests.TestPerson = new Tests.TestPerson();
            p.name = n;
            var id = personCollection.insert(p);
            return personCollection.getById(id);
        }

        haveBaby(mom:Tests.TestPerson, dad:Tests.TestPerson, callback:(err:any, p?:Tests.TestPerson)=>void):void {
            console.log("mom: ", mom);
            console.log("dad: ", dad);
            var kid:Tests.TestPerson = new Tests.TestPerson();
            kid.name = "child of " + mom.name + " and " + dad.name;
            kid.family["mom"] = mom;
            kid.family["dad"] = dad;
            var that = this;
            this.insert(kid, function (e:any, id:string) {
                console.log("The baby is inserted into the database");
                callback(e, id ? that.getById(id) : undefined);
            });
        }

        removePerson(id:string, callback:(err:any)=>void):void {
            this.remove(id, callback);
        }
    }
}
if( Meteor.isServer ) {
    Meteor.publish("persons", function(){
        return omm.MeteorPersistence.collections["TestPerson"].getMeteorCollection().find({});
    });
}
else
{
    Meteor.subscribe("persons");
}

omm.registerObject('TestPersonCollection', new Tests.TestPersonCollection());

omm.MeteorPersistence.wrapFunction(Tests.TestPersonCollection.prototype, "removePerson", "removePerson", true, null, new omm.ConstantObjectRetriever(new Tests.TestPersonCollection()) );
omm.MeteorPersistence.wrapFunction(Tests.TestPersonCollection.prototype, "newPerson", "newPerson", true, new omm.Serializer(new omm.MeteorObjectRetriever()), new omm.ConstantObjectRetriever(new Tests.TestPersonCollection()) );
omm.MeteorPersistence.wrapFunction(Tests.TestPersonCollection.prototype, "haveBaby", "haveBaby", true, new omm.Serializer(new omm.MeteorObjectRetriever()), new omm.ConstantObjectRetriever(new Tests.TestPersonCollection()) );
