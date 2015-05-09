/**
 * Created by bert on 03.05.15.
 */


import TestPerson = require("./TestPerson");
import TestTree = require("./TestTree");
import TestAddress = require("./TestAddress");
import MeteorPersistence = require("./MeteorPersistence");
import BaseCollection = require("./BaseCollection");
import Serializer = require("./Serializer");


class PersonCollection extends BaseCollection<TestPerson> {
    constructor()
    {
        super(TestPerson);
    }
    findByName(n:string):TestPerson {
        var arr:Array<TestPerson> = this.find({
            name: n
        });
        return arr.length > 0 ? arr[0] : undefined;
    }
}

//var treeCollection = new BaseCollection(TestTree);
//var personCollection = new PersonCollection();
//treeCollection.getAll().forEach(function(tree){
//    treeCollection.remove(tree);
//});
//personCollection.getAll().forEach(function(p){
//    personCollection.remove(p);
//});
//
//var tree1:TestTree = new TestTree("tree__");
//treeCollection.insert(tree1);
//
//var tp = new TestPerson("tp1","bert");
//tp.tree = tree1;
//personCollection.insert(tp); // tree is stored as id
//console.error(personCollection.getById("tp1").tree instanceof TestTree);


