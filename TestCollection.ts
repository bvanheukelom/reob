/**
 * Created by bert on 03.05.15.
 */


import TestPerson = require("./TestPerson");
import TestTree = require("./TestTree");
import TestAddress = require("./TestAddress");
import MeteorPersistence = require("./MeteorPersistence");
import BaseCollection = require("./BaseCollection");
import Serializer = require("./Serializer");

MeteorPersistence.init();

export class TestPersonCollection extends BaseCollection<TestPerson>
{
    constructor()
    {
        super(TestPerson);
    }
}

export class TestTreeCollection extends BaseCollection<TestTree>
{
    constructor()
    {
        super(TestTree);
    }
}


var bc = new TestPersonCollection();

var tp:TestPerson = new TestPerson("tp1","bert");
var value: string = Reflect.getMetadata("SubDocument", TestPerson.prototype, "phoneNumbers" );
tp.addAddress( new TestAddress("1","süd") );
tp.tree = new TestTree("tree1");


var s = Serializer.toDocument(tp);
var tp:TestPerson = <TestPerson>Serializer.toObject( s, TestPerson );
console.log( tp.tree.getId() );

