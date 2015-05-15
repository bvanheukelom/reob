/**
 * Created by bert on 13.05.15.
 */
///<reference path="references.d.ts"/>
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var TestTreeCollection = (function (_super) {
    __extends(TestTreeCollection, _super);
    function TestTreeCollection() {
        _super.call(this, Tests.TestTree);
    }
    TestTreeCollection.prototype.newTree = function (initialHeight, callback) {
        var that = this;
        this.insert(new Tests.TestTree(initialHeight));
    };
    TestTreeCollection.prototype.deleteTree = function (treeId) {
        this.remove(treeId);
    };
    return TestTreeCollection;
})(persistence.BaseCollection);
// TODO move to annotation
persistence.MeteorPersistence.wrapFunction(TestTreeCollection.prototype, "newTree", "newTree", true, null, new ConstantObjectRetriever(new TestTreeCollection()));
persistence.MeteorPersistence.wrapFunction(TestTreeCollection.prototype, "deleteTree", "deleteTree", true, null, new ConstantObjectRetriever(new TestTreeCollection()));
//# sourceMappingURL=TestTreeCollection.js.map