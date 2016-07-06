"use strict";
const Tests = require("./classes/Tests");
xdescribe("Omm on the server", function () {
    var personCollection;
    var treeCollection;
    beforeAll(function (done) {
        done();
    });
    beforeEach(function (done) {
        // Tests.registeredTestTreeCollection.removeAllListeners();
        // omm.removeAllUpdateEventListeners();
        // personCollection = new Tests.TestPersonCollection();
        // treeCollection = new Tests.TestTreeCollection();
        // done();
    });
    it("can load objects that have sub objects", function () {
        var id = Date.now() + "t444";
        var t1 = new Tests.TestPerson(id);
        t1.phoneNumber = new Tests.TestPhoneNumber("1212");
        personCollection.insert(t1).then((id) => {
            return personCollection.getById(id);
        }).then((p) => {
            expect(p).toBeDefined();
            expect(p.phoneNumber instanceof Tests.TestPhoneNumber).toBeTruthy();
        });
    });
    it("can load objects that have sub objects (in an array) which have a parent reference ", function () {
        var t1 = new Tests.TestTree(10);
        var i;
        treeCollection.insert(t1).then((id) => {
            i = id;
            return treeCollection.getById(id);
        }).then((t) => {
            return t1.grow();
        }).then(() => {
            return treeCollection.getById(i);
        }).then((t) => {
            treeCollection;
            expect(t).toBeDefined();
            expect(t.getLeaves()[0] instanceof Tests.TestLeaf).toBeTruthy();
            expect(t.getLeaves()[0].getTree() instanceof Tests.TestTree).toBeTruthy();
        });
    });
    it("can save objects that have sub objects (in an array) which have a parent reference", function () {
        var t1 = new Tests.TestTree(10);
        t1.grow();
        var i;
        treeCollection.insert(t1).then((id) => {
            i = id;
            return treeCollection.getById(id);
        }).then((t) => {
            expect(t).toBeDefined();
            expect(t.getLeaves()[0] instanceof Tests.TestLeaf).toBeTruthy();
        });
    });
    // it("can call wrapped functions", function (done) {
    //     treeCollection.newTree(24, function (err:any, t:Tests.TestTree) {
    //         t.grow();
    //         expect(treeCollection.getById(t.treeId)).toBeDefined();
    //         expect(treeCollection.getById(t.treeId).getLeaves().length).toBe(1);
    //         expect(treeCollection.getById(t.treeId).getLeaves()[0] instanceof Tests.TestLeaf).toBeTruthy();
    //         done();
    //     });
    // });
    //
    // it("serializes objects that have a parent property properly ", function () {
    //     var t1:Tests.TestTree = new Tests.TestTree(10);
    //     t1.grow();
    //     var serializer = new omm.Serializer(new omm.MeteorObjectRetriever());
    //     var doc:any = serializer.toDocument(t1);
    //     expect(doc.thoseGreenThings[0].tree).toBeUndefined();
    // });
    //
    // it("can save an array of foreign ids", function () {
    //     var p1:Tests.TestPerson = new Tests.TestPerson();
    //
    //     var t1:Tests.TestTree = new Tests.TestTree(10);
    //     treeCollection.insert(t1);
    //     var t2:Tests.TestTree = new Tests.TestTree(10);
    //     treeCollection.insert(t2);
    //     var t3:Tests.TestTree = new Tests.TestTree(10);
    //     treeCollection.insert(t3);
    //
    //     p1.trees.push(t1);
    //     p1.trees.push(t2);
    //     p1.trees.push(t3);
    //     personCollection.insert(p1);
    //
    //     expect(personCollection.getById(p1.getId()).trees).toBeDefined();
    //     expect(Array.isArray(personCollection.getById(p1.getId()).trees)).toBeTruthy();
    //
    //     expect(personCollection.getById(p1.getId()).trees[1].treeId).toBe(t2.treeId);
    // });
    //
    // it("can store objects as foreign keys that are an arrayOrMap entry and do not have an id", function () {
    //     var m = new Tests.TestPerson();
    //     m.addresses.push(new Tests.TestAddress("jockeh str.1"));
    //     personCollection.insert(m);
    //     var tree = new Tests.TestTree(347);
    //     tree.address = m.getAddresses()[0];
    //     var serializer = new omm.Serializer(new omm.MeteorObjectRetriever());
    //     var doc:any = serializer.toDocument(tree);
    //     expect(doc.address).toBe('TestPerson['+m.getId()+'].addresses|0');
    //     treeCollection.insert(tree);
    //     var t2 = treeCollection.getById(tree.treeId);
    //     expect(t2.address instanceof Tests.TestAddress).toBeTruthy();
    //     expect(t2.address.getStreet()).toBe("jockeh str.1");
    // });
    //
    // it("verifies that updateInProgress is false after an exception happned in the update function", function () {
    //     var m = new Tests.TestPerson("id1");
    //     personCollection.insert(m);
    //     try {
    //         personCollection.update("id1", function () {
    //             expect(omm.Status.updateInProgress).toBeTruthy();
    //             throw new Error("someting broke");
    //         });
    //         fail();
    //     } catch (e) {
    //     }
    //     expect(omm.Status.updateInProgress).toBeFalsy();
    // });
});
//# sourceMappingURL=ServerTests.spec.js.map