///<reference path="references.d.ts"/>
describe("The persistence thing", function () {
    var personCollection;
    var treeCollection;
    beforeAll(function (done) {
        personCollection = new TestPersonCollection();
        treeCollection = new TestTreeCollection();
        done();
    });
    beforeEach(function (done) {
        console.log("------------------- new test");
        persistence.BaseCollection.resetAll(function (error) {
            if (error)
                fail(error);
            done();
        });
    });
    it("knows the difference between root entities and subdocument entities ", function () {
        expect(persistence.PersistenceAnnotation.getCollectionName(Tests.TestPerson)).toBe("TestPerson");
        expect(persistence.PersistenceAnnotation.isRootEntity(Tests.TestPerson)).toBeTruthy();
        expect(persistence.PersistenceAnnotation.isRootEntity(Tests.TestTree)).toBeTruthy();
        expect(persistence.PersistenceAnnotation.isRootEntity(Tests.TestLeaf)).toBeFalsy();
    });
    it("knows the name of collections", function () {
        expect(personCollection.getName()).toBe("TestPerson");
        expect(treeCollection.getName()).toBe("TheTreeCollection");
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
    function onlyOnce(f) {
        var counter = 0;
        return function () {
            if (counter > 0) {
                throw new Error("Function called twice");
            }
            counter = 1;
            f.apply(this, arguments);
        };
    }
    it("can do basic inserts", function (done) {
        treeCollection.newTree(20, onlyOnce(function (error, tree) {
            expect(error).toBeFalsy();
            expect(tree).toBeDefined();
            expect(tree.persistencePath).toBeDefined();
            expect(tree instanceof Tests.TestTree).toBeTruthy();
            expect(tree.getId()).toBeDefined();
            expect(tree.getHeight()).toBe(20);
            expect(treeCollection.getById(tree.getId())).toBeDefined();
            expect(treeCollection.getById(tree.getId()).getId()).toBeDefined();
            expect(treeCollection.getById(tree.getId()).getHeight()).toBe(20);
            done();
        }));
    });
    it("can call server functions", function (done) {
        var c = 0;
        treeCollection.serverFunction("World", new Tests.TestTree(212), 42, onlyOnce(function (e, s) {
            c++;
            if (c > 1)
                fail("executed more than once");
            expect(s).toBe("Hello World! This is on the server t:true 212 n:42 number");
            expect(e).toBeUndefined();
            done();
        }));
    });
    it("can monkey patch functions", function () {
        var f = function f() {
            this.c = 0;
        };
        f.prototype.hello = function (p) {
            this.c += p;
        };
        persistence.MeteorPersistence.monkeyPatch(f.prototype, "hello", function (original, p) {
            expect(this.c).toBe(0);
            this.c++;
            original.call(this, p);
        });
        var x = new f();
        x.hello(20);
        expect(x.c).toBe(21);
    });
    it("uses persistence paths to return undefined for non existent subobjects ", function () {
        var t1 = new Tests.TestTree(10);
        var pp = new persistence.PersistencePath("TestTree", "tree1");
        pp.appendArrayOrMapLookup("leaves", "nonexistentLeaf");
        expect(pp.getSubObject(t1)).toBeUndefined();
    });
    it("can do basic removes", function (done) {
        treeCollection.newTree(20, function (err, t) {
            expect(treeCollection.getById(t.getId())).toBeDefined();
            treeCollection.deleteTree(t.getId(), function (err) {
                expect(treeCollection.getById(t.getId())).toBeUndefined();
                done();
            });
        });
    });
    it("uses persistence paths on root documents", function () {
        var t1 = new Tests.TestTree(123);
        t1.setId("tree1");
        t1.grow();
        persistence.MeteorPersistence.updatePersistencePaths(t1);
        expect(t1["persistencePath"]).toBeDefined();
        expect(t1["persistencePath"].toString()).toBe("TheTreeCollection[tree1]");
    });
    it("uses persistence paths on sub documents", function () {
        var tp = new Tests.TestPerson("tp1");
        tp.phoneNumber = new Tests.TestPhoneNumber("12345");
        persistence.MeteorPersistence.updatePersistencePaths(tp);
        expect(tp.phoneNumber["persistencePath"]).toBeDefined();
        expect(tp.phoneNumber["persistencePath"].toString()).toBe("TestPerson[tp1].phoneNumber");
    });
    it("can call wrapped functions that are not part of a collection", function () {
        var t1 = new Tests.TestTree(10);
        t1.grow();
        expect(t1.getLeaves().length).toBe(1);
    });
    it("uses persistence paths on subdocuments in arrays", function () {
        var t1 = new Tests.TestTree(10);
        t1.setId("tree1");
        t1.grow();
        persistence.MeteorPersistence.updatePersistencePaths(t1);
        expect(t1.getLeaves().length).toBe(1);
        expect(t1.getLeaves()[0]["persistencePath"]).toBeDefined();
        expect(t1.getLeaves()[0]["persistencePath"].toString()).toBe("TheTreeCollection[tree1].leaves|leaf11");
    });
    it("serializes basic objects", function () {
        var t1 = new Tests.TestPerson("tp1");
        t1.phoneNumber = new Tests.TestPhoneNumber("12345");
        var doc = new DeSerializer.Serializer(new persistence.MeteorObjectRetriever()).toDocument(t1);
        expect(doc._id).toBe("tp1");
        expect(doc["phoneNumber"]["number"]).toBe("12345");
    });
    it("deserializes basic objects", function () {
        var serializer = new DeSerializer.Serializer(new persistence.MeteorObjectRetriever());
        var t1 = new Tests.TestPerson("tp1");
        t1.phoneNumber = new Tests.TestPhoneNumber("12345");
        var doc = serializer.toDocument(t1);
        var t1 = serializer.toObject(doc, Tests.TestPerson);
        expect(t1.getId()).toBe("tp1");
        expect(t1.phoneNumber instanceof Tests.TestPhoneNumber).toBeTruthy();
        expect(t1.phoneNumber.getNumber()).toBe("12345");
    });
    it("deserializes objects that have subobjects", function () {
        var serializer = new DeSerializer.Serializer(new persistence.MeteorObjectRetriever());
        var t1 = new Tests.TestTree(123);
        t1.setId("t1");
        t1.grow();
        var doc = serializer.toDocument(t1);
        var t1 = serializer.toObject(doc, Tests.TestTree);
        expect(t1.getId()).toBe("t1");
        expect(t1.getLeaves()[0] instanceof Tests.TestLeaf).toBeTruthy();
    });
    it("reoves all", function () {
        expect(true).toBeTruthy();
    });
    it("can use persistence paths on objects that have foreign key properties", function () {
        var t1 = new Tests.TestTree(12);
        t1.setId("dfdf");
        var tp = new Tests.TestPerson("tp");
        tp.tree = t1;
        persistence.MeteorPersistence.updatePersistencePaths(tp);
    });
    it("can serialize objects that have foreign key properties", function () {
        var t1 = new Tests.TestTree(122);
        t1.setId("tree1");
        var tp = new Tests.TestPerson("tp");
        tp.tree = t1;
        var doc = new DeSerializer.Serializer(new persistence.MeteorObjectRetriever()).toDocument(tp);
        expect(doc["tree"]).toBe("TheTreeCollection[tree1]");
    });
    it("can save objects that have foreign key properties", function (done) {
        personCollection.newPerson("jake", function (error, jake) {
            expect(error).toBeUndefined();
            expect(jake).toBeDefined();
            treeCollection.newTree(12, function (error, t) {
                jake.chooseTree(t);
                var loadedJake = personCollection.getById(jake.getId());
                expect(loadedJake).toBeDefined();
                expect(loadedJake.tree).toBeDefined();
                done();
            });
        });
    });
    it("can save objects that have subobjects which are subobjects of other root objects", function (done) {
        treeCollection.newTree(10, function (err, t) {
            expect(t).toBeDefined();
            t.grow();
            personCollection.newPerson("girl", function (err, tp) {
                tp.chooseTree(t);
                tp.collectLeaf();
                expect(tp.leaf).toBeDefined();
                expect(tp.leaf.getId()).toBe(t.getLeaves()[0].getId());
                expect(personCollection.getById(tp.getId()).leaf).toBeDefined();
                expect(personCollection.getById(tp.getId()).leaf.getId()).toBe(t.getLeaves()[0].getId());
                done();
            });
        });
    });
    it("can save objects that have subobjects which are one of many elements in a subobject-array of another root object", function (done) {
        var c = 0;
        treeCollection.newTree(10, function (err, t1) {
            c++;
            if (c > 1)
                fail();
            for (var i = 0; i < 10; i++)
                t1.grow();
            expect(t1.getLeaves().length).toBe(10);
            personCollection.newPerson("girl", function (err, tp) {
                c++;
                if (c > 2)
                    fail();
                expect(t1.getLeaves()[5]).toBeDefined();
                tp.chooseLeaf(t1.getLeaves()[5]);
                expect(personCollection.getById(tp.getId()).leaf).toBeDefined();
                done();
            });
        });
    });
});
