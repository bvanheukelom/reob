/**
 * Created by bert on 03.05.15.
 */


import Test = require("./TestClass");
import MeteorPersistence = require("./MeteorPersistence");
import Serializer = require("./Serializer");

MeteorPersistence.init();

export class TestPersonCollection extends MeteorPersistence.BaseCollection<Test.TestPerson>
{
    constructor()
    {
        super(Test.TestPerson);
    }
}

export class TestTreeCollection extends MeteorPersistence.BaseCollection<Test.TestTree>
{
    constructor()
    {
        super(Test.TestTree);
    }
}


var bc = new TestPersonCollection();

var tp:Test.TestPerson = new Test.TestPerson("tp1","bert");
var value: string = Reflect.getMetadata("SubDocument", Test.TestPerson.prototype, "phoneNumbers" );
tp.addAddress( new Test.TestAddress("1","süd") );
tp.tree = new Test.TestTree("tree1");


var s = Serializer.toDocument(tp);
var tp:Test.TestPerson = <Test.TestPerson>Serializer.toObject( s, Test.TestPerson );
console.log( tp.tree.getId() );

