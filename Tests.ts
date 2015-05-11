///<reference path="references.d.ts"/>

describe("The persistence thing", function(){

    var personCollection:TestPersonCollection;
    var treeCollection:persistence.BaseCollection<TestTree>;

    beforeAll(function(){
        personCollection = new TestPersonCollection();
        treeCollection = new persistence.BaseCollection<TestTree>(TestTree);
    });

    afterEach(function(){
        personCollection.getMeteorCollection().remove({});
        treeCollection.getMeteorCollection().remove({});
    });

    it( "knows the difference between root entities and subdocument entities ", function(){
        expect( persistence.PersistenceAnnotation.getCollectionName(TestPerson) ).toBe("TestPerson");
        expect( persistence.PersistenceAnnotation.isRootEntity(TestPerson) ).toBeTruthy();
        expect( persistence.PersistenceAnnotation.isRootEntity(TestTree) ).toBeTruthy();
        expect( persistence.PersistenceAnnotation.isRootEntity(TestLeaf) ).toBeFalsy();
    });

    it( "knows types ", function(){
        expect( persistence.PersistenceAnnotation.getPropertyClass(TestPerson, "tree") ).toBe(TestTree);
        expect( persistence.PersistenceAnnotation.getPropertyClass(TestPerson, "leaf") ).toBe(TestLeaf);
    });

    it("can do basic inserts", function(){
        var t1:TestTree = new TestTree("tree1");
        console.log("tree :",t1);
        treeCollection.insert(t1);
        expect( treeCollection.getById("tree1")).toBeDefined();
        expect( treeCollection.getById("tree1").getId()).toBe("tree1");
    });

    it("can do basic removes", function(){
        var t1:TestTree = new TestTree("tree1");
        treeCollection.insert(t1);
        expect( treeCollection.getById("tree1")).toBeDefined();
        treeCollection.remove(t1);
        expect( treeCollection.getById("tree1")).toBeUndefined();
    });

    it("uses persistence paths on root documents", function(){
        var t1:TestTree = new TestTree("tree1");
        t1.grow();
        persistence.MeteorPersistence.updatePersistencePaths(t1);
        expect(t1["persistencePath"]).toBeDefined();
        expect(t1["persistencePath"].toString()).toBe("TestTree[tree1]");
    });

    it("uses persistence paths on sub documents", function(){
        var tp:TestPerson = new TestPerson("tp1");
        tp.phoneNumber = new TestPhoneNumber("12345");
        persistence.MeteorPersistence.updatePersistencePaths(tp);
        expect(tp.phoneNumber["persistencePath"]).toBeDefined();
        expect(tp.phoneNumber["persistencePath"].toString()).toBe("TestPerson[tp1].phoneNumber");
    });

    it("uses persistence paths on subdocuments in arrays", function(){
        var t1:TestTree = new TestTree("tree1");
        t1.grow();
        persistence.MeteorPersistence.updatePersistencePaths(t1);
        expect(t1.getLeaves()[0]["persistencePath"]).toBeDefined();
        expect(t1.getLeaves()[0]["persistencePath"].toString()).toBe("TestTree[tree1].leaves.leaf11");
    });

    it("serializes basic objects", function(){
        var t1:TestPerson = new TestPerson("tp1");
        t1.phoneNumber = new TestPhoneNumber("12345");
        var doc = DeSerializer.Serializer.toDocument(t1);
        expect(doc._id).toBe("tp1");
        expect(doc["phoneNumber"]["number"]).toBe("12345");
    });

    it("deserializes basic objects", function(){
        var t1:TestPerson = new TestPerson("tp1");
        t1.phoneNumber = new TestPhoneNumber("12345");
        var doc = DeSerializer.Serializer.toDocument(t1);
        var t1:TestPerson = DeSerializer.Serializer.toObject(doc, TestPerson);
        expect(t1.getId()).toBe("tp1");
        expect(t1.phoneNumber instanceof TestPhoneNumber).toBeTruthy();
        expect(t1.phoneNumber.getNumber()).toBe("12345");
    });
    it("deserializes objects that have subobjects", function(){
        var t1:TestTree = new TestTree("t1");
        t1.grow();
        var doc = DeSerializer.Serializer.toDocument(t1);
        var t1:TestTree = DeSerializer.Serializer.toObject(doc, TestTree);
        expect(t1.getId()).toBe("t1");
        expect(t1.getLeaves()[0] instanceof TestLeaf).toBeTruthy();
    });

    it("can load objects that have subobjects", function(){
        var t1:TestPerson = new TestPerson("t");
        t1.phoneNumber = new TestPhoneNumber("1212");
        personCollection.insert(t1);
        expect(personCollection.getById("t")).toBeDefined();
        expect(personCollection.getById("t").phoneNumber instanceof TestPhoneNumber).toBeTruthy();
    });

    it("can load objects that have subobjects (in an array) which have a parent reference", function(){
        var t1:TestTree = new TestTree("tree1");
        t1.grow();
        treeCollection.insert(t1);
        expect(treeCollection.getById("tree1")).toBeDefined();
        expect(treeCollection.getById("tree1").getLeaves()[0] instanceof TestLeaf).toBeTruthy();
    });

    it("can remove objects that have subobjects", function(){
        var t1:TestTree = new TestTree("tree1");
        t1.grow();
        treeCollection.insert(t1);
        expect(treeCollection.getById("tree1")).toBeDefined();
        expect(treeCollection.getById("tree1").getLeaves()[0] instanceof TestLeaf).toBeTruthy();
    });

    it("can call wrapped functions", function(){
        var t1:TestTree = new TestTree("tree1");
        treeCollection.insert(t1);
        t1.grow();
        expect(treeCollection.getById("tree1")).toBeDefined();
        expect(treeCollection.getById("tree1").getLeaves()[0] instanceof TestLeaf).toBeTruthy();
    });

    it("can use persistence paths on objects that have foreign key properties", function(){
        var t1:TestTree = new TestTree("tree1");
        var tp:TestPerson = new TestPerson("tp");
        tp.tree = t1;
        persistence.MeteorPersistence.updatePersistencePaths(tp);
    });

    it("can serialize objects that have foreign key properties", function(){
        var t1:TestTree = new TestTree("tree1");
        var tp:TestPerson = new TestPerson("tp");
        tp.tree = t1;
        var doc = DeSerializer.Serializer.toDocument(tp);
        expect( doc["tree"] ).toBe("TestTree[tree1]");
    });


    it("lazy loads objects", function(){
        var t1:TestTree = new TestTree("tree1");
        treeCollection.insert(t1);
        var tp:TestPerson = new TestPerson("tp");
        tp.tree = t1;
        personCollection.insert(tp);
        var tp2 = personCollection.getById("tp");
        expect( persistence.MeteorPersistence.needsLazyLoading(tp2, "tree") ).toBeTruthy();
        var trt = tp2.tree;
        expect( trt ).toBeDefined();
        expect( persistence.MeteorPersistence.needsLazyLoading(tp2, "tree") ).toBeFalsy();
    });

    it("can save objects that have foreign key properties", function(){
        var t1:TestTree = new TestTree("tree1");
        treeCollection.insert(t1);
        var tp:TestPerson = new TestPerson("tp");
        tp.tree = t1;
        personCollection.insert(tp);
        expect(personCollection.getById("tp")).toBeDefined();
        expect(personCollection.getById("tp").tree).toBeDefined();
    });

    it("XXXXXX can save an array of foreign ids", function(){
        var p1:TestPerson = new TestPerson("p1");

        var t1:TestTree = new TestTree("t1");
        treeCollection.insert(t1);
        var t2:TestTree = new TestTree("t2");
        treeCollection.insert(t2);
        var t3:TestTree = new TestTree("t3");
        treeCollection.insert(t3);

        p1.trees.push(t1);
        p1.trees.push(t2);
        p1.trees.push(t3);
        personCollection.insert(p1);

        expect(personCollection.getById("p1").trees).toBeDefined();
        expect(Array.isArray( personCollection.getById("p1").trees )).toBeTruthy();
        expect( personCollection.getById("p1").trees[1].getId()).toBe("t2");
    });

    it("can save objects that have subobjects which are subobjects of other root objects", function(){
        var t1:TestTree = new TestTree("tree1");
        treeCollection.insert(t1);
        t1.grow();
        var tp:TestPerson = new TestPerson("tp");
        tp.tree = t1;
        personCollection.insert(tp);
        tp.collectLeaf();
        expect(personCollection.getById("tp").leaf).toBeDefined();
        expect(personCollection.getById("tp").leaf.getId()).toBe(t1.getLeaves()[0].getId());
    });

    it("can save objects that have subobjects which are one of many elements in a subobject-array of another root object", function(){
        var t1:TestTree = new TestTree("tree1");
        treeCollection.insert(t1);

        for( var i=0;i<10;i++)
            t1.grow();

        var tp:TestPerson = new TestPerson("tp");
        tp.leaf = t1.getLeaves()[5];
        personCollection.insert(tp);
        expect(personCollection.getById("tp").leaf).toBeDefined();
        expect(personCollection.getById("tp").leaf.getId()).toBe(t1.getLeaves()[5].getId());
        expect(personCollection.getById("tp").leaf.greenNess).toBe(t1.getLeaves()[5].greenNess);
    });

    it("can serialize object in a map", function(){
        var tp = new TestPerson("tp");
        tp.phoneBook["klaus"] = new TestPhoneNumber("121212");
        var doc:any = DeSerializer.Serializer.toDocument(tp);

        expect( doc ).toBeDefined();
        expect( doc.phoneBook ).toBeDefined();
        expect( doc.phoneBook["klaus"] ).toBeDefined();
        expect( doc.phoneBook["klaus"].number ).toBeDefined();
    });

    it("can serialize object in a map as foreign key", function(){
        var tp = new TestPerson("tp");
        tp.wood["klaus"] = new TestTree("t1");
        treeCollection.insert(tp.wood["klaus"]);
        tp.wood["peter"] = new TestTree("t2");
        treeCollection.insert(tp.wood["peter"]);
        var doc:any = DeSerializer.Serializer.toDocument(tp);
        expect( doc ).toBeDefined();
        expect( doc.wood ).toBeDefined();
        expect( doc.wood["klaus"] ).toBeDefined();
        expect( doc.wood["klaus"] ).toBe("TestTree[t1]");
        expect( doc.wood["peter"] ).toBe("TestTree[t2]");
    });

    it("can save object in a map", function(){
        var tp = new TestPerson("tp");
        tp.wood["klaus"] = new TestTree("t1");
        treeCollection.insert(tp.wood["klaus"]);
        tp.wood["peter"] = new TestTree("t2");
        treeCollection.insert(tp.wood["peter"]);
        console.log("-----");
        debugger;
        personCollection.insert( tp );
        expect( personCollection.getById("tp").phoneBook ).toBeDefined();
        expect( typeof personCollection.getById("tp").phoneBook ).toBe("object");
        expect( personCollection.getById("tp").phoneBook["1"] ).toBeDefined();
        expect( personCollection.getById("tp").phoneBook["1"] instanceof TestPhoneNumber ).toBeTruthy();
        expect( personCollection.getById("tp").phoneBook["1"].getNumber() ).toBe("121212");
    })

    // Maps (merge with array, use .Collection("<Entry-ClassName>") annotation for both

    // callbacks

    // tests

    // store smart objects in dumb objects ?

    // foreign key arrays with undefined entries
    // subdocument arrays with undefined entries
    // wrapped function results
    // test that something stored as a foreign key (both sub and root) turns undefined after the foreign root is deleted

});