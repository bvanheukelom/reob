///<reference path="references.d.ts"/>
var TestPersonCollection = require("./TestPersonCollection");
var BaseCollection = require("./BaseCollection");
var TestTree = require("./TestTree");
describe("The persistence thing", function () {
    var personCollection;
    var treeCollection;
    beforeAll(function () {
        personCollection = new TestPersonCollection();
        treeCollection = new BaseCollection(TestTree);
    });
    beforeEach(function () {
        personCollection.getAll().forEach(function (person) {
            personCollection.remove(person);
        });
        treeCollection.getAll().forEach(function (tree) {
            treeCollection.remove(tree);
        });
    });
    it("can do basic inserts", function () {
        var t1 = new TestTree("tree1");
        treeCollection.insert(t1);
        expect(treeCollection.getById("tree1")).toBeDefined();
        expect(treeCollection.getById("tree1").getId()).toBe("tree1");
    });
});
//# sourceMappingURL=Tests.js.map