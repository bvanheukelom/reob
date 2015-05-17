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
        var t = new Tests.TestTree(initialHeight);
        try {
            var id = this.insert(t);
            callback(undefined, this.getById(id));
        }
        catch (err) {
            callback(err);
        }
    };
    TestTreeCollection.prototype.deleteTree = function (treeId, cb) {
        this.remove(treeId, cb);
    };
    TestTreeCollection.prototype.serverFunction = function (treeId, t, n, cb) {
        cb(undefined, "Hello " + treeId + "! This is on the " + (Meteor.isServer ? "server" : "client") + " t:" + (t instanceof Tests.TestTree) + " " + t.getHeight() + " n:" + n + " " + (typeof n));
    };
    return TestTreeCollection;
})(persistence.BaseCollection);
if (Meteor.isServer) {
    Meteor.publish("trees", function () {
        return persistence.MeteorPersistence.collections["TheTreeCollection"].getMeteorCollection().find({});
    });
}
else {
    Meteor.subscribe("trees");
}
persistence.MeteorPersistence.wrapFunction(TestTreeCollection.prototype, "newTree", "newTree", true, new DeSerializer.Serializer(new persistence.MeteorObjectRetriever()), new persistence.ConstantObjectRetriever(new TestTreeCollection()));
persistence.MeteorPersistence.wrapFunction(TestTreeCollection.prototype, "deleteTree", "deleteTree", true, new DeSerializer.Serializer(new persistence.MeteorObjectRetriever()), new persistence.ConstantObjectRetriever(new TestTreeCollection()));
persistence.MeteorPersistence.wrapFunction(TestTreeCollection.prototype, "serverFunction", "serverFunction", true, new DeSerializer.Serializer(new persistence.MeteorObjectRetriever()), new persistence.ConstantObjectRetriever(new TestTreeCollection()));
//# sourceMappingURL=TestTreeCollection.js.map