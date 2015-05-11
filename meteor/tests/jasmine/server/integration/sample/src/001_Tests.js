///<reference path="references.d.ts"/>
describe("The persistence thing", function () {
    var personCollection;
    var treeCollection;
    beforeAll(function () {
        personCollection = new TestPersonCollection();
        treeCollection = new persistence.BaseCollection(Tests.TestTree);
    });
    afterEach(function () {
        personCollection.getMeteorCollection().remove({});
        treeCollection.getMeteorCollection().remove({});
    });
    it("knows the difference between root entities and subdocument entities ", function () {
        expect(persistence.PersistenceAnnotation.getCollectionName(Tests.TestPerson)).toBe("TestPerson");
        expect(persistence.PersistenceAnnotation.isRootEntity(Tests.TestPerson)).toBeTruthy();
        expect(persistence.PersistenceAnnotation.isRootEntity(Tests.TestTree)).toBeTruthy();
        expect(persistence.PersistenceAnnotation.isRootEntity(Tests.TestLeaf)).toBeFalsy();
    });
    it("knows types ", function () {
        expect(persistence.PersistenceAnnotation.getPropertyClass(Tests.TestPerson, "tree")).toBe(Tests.TestTree);
        expect(persistence.PersistenceAnnotation.getPropertyClass(Tests.TestPerson, "leaf")).toBe(Tests.TestLeaf);
    });
    it("can do basic inserts", function () {
        var t1 = new Tests.TestTree("tree1");
        console.log("tree :", t1);
        treeCollection.insert(t1);
        expect(treeCollection.getById("tree1")).toBeDefined();
        expect(treeCollection.getById("tree1").getId()).toBe("tree1");
    });
    it("can do basic removes", function () {
        var t1 = new Tests.TestTree("tree1");
        treeCollection.insert(t1);
        expect(treeCollection.getById("tree1")).toBeDefined();
        treeCollection.remove(t1);
        expect(treeCollection.getById("tree1")).toBeUndefined();
    });
    it("uses persistence paths on root documents", function () {
        var t1 = new Tests.TestTree("tree1");
        t1.grow();
        persistence.MeteorPersistence.updatePersistencePaths(t1);
        expect(t1["persistencePath"]).toBeDefined();
        expect(t1["persistencePath"].toString()).toBe("TestTree[tree1]");
    });
    it("uses persistence paths on sub documents", function () {
        var tp = new Tests.TestPerson("tp1");
        tp.phoneNumber = new Tests.TestPhoneNumber("12345");
        persistence.MeteorPersistence.updatePersistencePaths(tp);
        expect(tp.phoneNumber["persistencePath"]).toBeDefined();
        expect(tp.phoneNumber["persistencePath"].toString()).toBe("TestPerson[tp1].phoneNumber");
    });
    it("uses persistence paths on subdocuments in arrays", function () {
        var t1 = new Tests.TestTree("tree1");
        t1.grow();
        persistence.MeteorPersistence.updatePersistencePaths(t1);
        expect(t1.getLeaves()[0]["persistencePath"]).toBeDefined();
        expect(t1.getLeaves()[0]["persistencePath"].toString()).toBe("TestTree[tree1].leaves.leaf11");
    });
    it("serializes basic objects", function () {
        var t1 = new Tests.TestPerson("tp1");
        t1.phoneNumber = new Tests.TestPhoneNumber("12345");
        var doc = DeSerializer.Serializer.toDocument(t1);
        expect(doc._id).toBe("tp1");
        expect(doc["phoneNumber"]["number"]).toBe("12345");
    });
    it("deserializes basic objects", function () {
        var t1 = new Tests.TestPerson("tp1");
        t1.phoneNumber = new Tests.TestPhoneNumber("12345");
        var doc = DeSerializer.Serializer.toDocument(t1);
        var t1 = DeSerializer.Serializer.toObject(doc, Tests.TestPerson);
        expect(t1.getId()).toBe("tp1");
        expect(t1.phoneNumber instanceof Tests.TestPhoneNumber).toBeTruthy();
        expect(t1.phoneNumber.getNumber()).toBe("12345");
    });
    it("deserializes objects that have subobjects", function () {
        var t1 = new Tests.TestTree("t1");
        t1.grow();
        var doc = DeSerializer.Serializer.toDocument(t1);
        var t1 = DeSerializer.Serializer.toObject(doc, Tests.TestTree);
        expect(t1.getId()).toBe("t1");
        expect(t1.getLeaves()[0] instanceof Tests.TestLeaf).toBeTruthy();
    });
    it("can load objects that have subobjects", function () {
        var t1 = new Tests.TestPerson("t");
        t1.phoneNumber = new Tests.TestPhoneNumber("1212");
        personCollection.insert(t1);
        expect(personCollection.getById("t")).toBeDefined();
        expect(personCollection.getById("t").phoneNumber instanceof Tests.TestPhoneNumber).toBeTruthy();
    });
    it("can load objects that have subobjects (in an array) which have a parent reference", function () {
        var t1 = new Tests.TestTree("tree1");
        t1.grow();
        treeCollection.insert(t1);
        expect(treeCollection.getById("tree1")).toBeDefined();
        expect(treeCollection.getById("tree1").getLeaves()[0] instanceof Tests.TestLeaf).toBeTruthy();
    });
    it("can remove objects that have subobjects", function () {
        var t1 = new Tests.TestTree("tree1");
        t1.grow();
        treeCollection.insert(t1);
        expect(treeCollection.getById("tree1")).toBeDefined();
        expect(treeCollection.getById("tree1").getLeaves()[0] instanceof Tests.TestLeaf).toBeTruthy();
    });
    it("can call wrapped functions", function () {
        var t1 = new Tests.TestTree("tree1");
        treeCollection.insert(t1);
        t1.grow();
        expect(treeCollection.getById("tree1")).toBeDefined();
        expect(treeCollection.getById("tree1").getLeaves()[0] instanceof Tests.TestLeaf).toBeTruthy();
    });
    it("can use persistence paths on objects that have foreign key properties", function () {
        var t1 = new Tests.TestTree("tree1");
        var tp = new Tests.TestPerson("tp");
        tp.tree = t1;
        persistence.MeteorPersistence.updatePersistencePaths(tp);
    });
    it("can serialize objects that have foreign key properties", function () {
        var t1 = new Tests.TestTree("tree1");
        var tp = new Tests.TestPerson("tp");
        tp.tree = t1;
        var doc = DeSerializer.Serializer.toDocument(tp);
        expect(doc["tree"]).toBe("TestTree[tree1]");
    });
    it("lazy loads objects", function () {
        var t1 = new Tests.TestTree("tree1");
        treeCollection.insert(t1);
        var tp = new Tests.TestPerson("tp");
        tp.tree = t1;
        personCollection.insert(tp);
        var tp2 = personCollection.getById("tp");
        expect(persistence.MeteorPersistence.needsLazyLoading(tp2, "tree")).toBeTruthy();
        var trt = tp2.tree;
        expect(trt).toBeDefined();
        expect(persistence.MeteorPersistence.needsLazyLoading(tp2, "tree")).toBeFalsy();
    });
    it("can save objects that have foreign key properties", function () {
        var t1 = new Tests.TestTree("tree1");
        treeCollection.insert(t1);
        var tp = new Tests.TestPerson("tp");
        tp.tree = t1;
        personCollection.insert(tp);
        expect(personCollection.getById("tp")).toBeDefined();
        expect(personCollection.getById("tp").tree).toBeDefined();
    });
    it("XXXXXX can save an array of foreign ids", function () {
        var p1 = new Tests.TestPerson("p1");
        var t1 = new Tests.TestTree("t1");
        treeCollection.insert(t1);
        var t2 = new Tests.TestTree("t2");
        treeCollection.insert(t2);
        var t3 = new Tests.TestTree("t3");
        treeCollection.insert(t3);
        p1.trees.push(t1);
        p1.trees.push(t2);
        p1.trees.push(t3);
        personCollection.insert(p1);
        expect(personCollection.getById("p1").trees).toBeDefined();
        expect(Array.isArray(personCollection.getById("p1").trees)).toBeTruthy();
        expect(personCollection.getById("p1").trees[1].getId()).toBe("t2");
    });
    it("can save objects that have subobjects which are subobjects of other root objects", function () {
        var t1 = new Tests.TestTree("tree1");
        treeCollection.insert(t1);
        t1.grow();
        var tp = new Tests.TestPerson("tp");
        tp.tree = t1;
        personCollection.insert(tp);
        tp.collectLeaf();
        expect(personCollection.getById("tp").leaf).toBeDefined();
        expect(personCollection.getById("tp").leaf.getId()).toBe(t1.getLeaves()[0].getId());
    });
    it("can save objects that have subobjects which are one of many elements in a subobject-array of another root object", function () {
        var t1 = new Tests.TestTree("tree1");
        treeCollection.insert(t1);
        for (var i = 0; i < 10; i++)
            t1.grow();
        var tp = new Tests.TestPerson("tp");
        tp.leaf = t1.getLeaves()[5];
        personCollection.insert(tp);
        expect(personCollection.getById("tp").leaf).toBeDefined();
        expect(personCollection.getById("tp").leaf.getId()).toBe(t1.getLeaves()[5].getId());
        expect(personCollection.getById("tp").leaf.greenNess).toBe(t1.getLeaves()[5].greenNess);
    });
    it("can serialize object in a map", function () {
        var tp = new Tests.TestPerson("tp");
        tp.phoneBook["klaus"] = new Tests.TestPhoneNumber("121212");
        var doc = DeSerializer.Serializer.toDocument(tp);
        expect(doc).toBeDefined();
        expect(doc.phoneBook).toBeDefined();
        expect(doc.phoneBook["klaus"]).toBeDefined();
        expect(doc.phoneBook["klaus"].number).toBeDefined();
    });
    it("can serialize object in a map as foreign key", function () {
        var tp = new Tests.TestPerson("tp");
        tp.wood["klaus"] = new Tests.TestTree("t1");
        treeCollection.insert(tp.wood["klaus"]);
        tp.wood["peter"] = new Tests.TestTree("t2");
        treeCollection.insert(tp.wood["peter"]);
        var doc = DeSerializer.Serializer.toDocument(tp);
        expect(doc).toBeDefined();
        expect(doc.wood).toBeDefined();
        expect(doc.wood["klaus"]).toBeDefined();
        expect(doc.wood["klaus"]).toBe("TestTree[t1]");
        expect(doc.wood["peter"]).toBe("TestTree[t2]");
    });
    it("can save foreign keys in a map", function () {
        var tp = new Tests.TestPerson("tp");
        tp.wood["klaus"] = new Tests.TestTree("t1");
        treeCollection.insert(tp.wood["klaus"]);
        tp.wood["peter"] = new Tests.TestTree("t2");
        treeCollection.insert(tp.wood["peter"]);
        expect(tp.wood["peter"] instanceof Tests.TestTree).toBeTruthy();
        console.log("-----");
        debugger;
        personCollection.insert(tp);
        console.log("-----2");
        expect(personCollection.getById("tp")).toBeDefined();
        console.log("-----21");
        expect(personCollection.getById("tp").wood).toBeDefined();
        console.log("-----3");
        expect(typeof personCollection.getById("tp").wood).toBe("object");
        console.log("-----4");
        expect(personCollection.getById("tp").wood["peter"]).toBeDefined();
        console.log("-----5", personCollection.getById("tp").wood["peter"]);
        expect(personCollection.getById("tp").wood["peter"] instanceof Tests.TestTree).toBeTruthy();
        console.log("-----6");
        expect(personCollection.getById("tp").wood["peter"].getId()).toBe("t2");
    });
});
