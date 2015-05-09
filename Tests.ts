///<reference path="references.d.ts"/>

import TestPersonCollection = require("./TestPersonCollection");
import BaseCollection = require("./BaseCollection");
import TestTree = require("./TestTree");
import TestPerson = require("./TestPerson");

describe("The persistence thing", function(){
    var personCollection:TestPersonCollection;
    var treeCollection:BaseCollection<TestTree>;
    beforeAll(function(){
        personCollection = new TestPersonCollection();
        treeCollection = new BaseCollection<TestTree>(TestTree);
    });

    beforeEach(function(){
        personCollection.getAll().forEach(function(person:TestPerson){
            personCollection.remove(person);
        });
        treeCollection.getAll().forEach(function(tree:TestTree){
            treeCollection.remove(tree);
        });
    });

    it("can do basic inserts", function(){
        var t1:TestTree = new TestTree("tree1");
        treeCollection.insert(t1);
        expect( treeCollection.getById("tree1")).toBeDefined();
        expect( treeCollection.getById("tree1").getId()).toBe("tree1");
    });

});