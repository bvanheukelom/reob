///<reference path="references.d.ts"/>
describe("The persistence thing", function () {
    var personCollection;
    var treeCollection;
    beforeAll(function () {
        personCollection = new TestPersonCollection();
        treeCollection = new TestTreeCollection();
    });
    beforeEach(function (done) {
        console.log("------------------- new test");
        treeCollection.removeAll(function (err) {
            if (!err) {
                treeCollection.removeAll(function (error) {
                    if (!error)
                        done();
                    else
                        fail(error);
                });
            }
            else
                fail(err);
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
    it("can do basic inserts", function (done) {
        var t1 = new Tests.TestTree();
        console.log("tree :", t1);
        treeCollection.newTree(20, function (error, tree) {
            expect(error).toBeUndefined();
            expect(tree).toBeDefined();
            expect(tree.getId()).toBeDefined();
            expect(tree.getHeight()).toBe(20);
            expect(treeCollection.getById(tree.getId())).toBeDefined();
            expect(treeCollection.getById(tree.getId()).getId()).toBeDefined();
            expect(treeCollection.getById(tree.getId()).getHeight()).toBe(20);
            done();
        });
    });
});
