/**
 * Created by bert on 03.05.15.
 */
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var TestPerson = require("./TestPerson");
var TestTree = require("./TestTree");
var TestAddress = require("./TestAddress");
var MeteorPersistence = require("./MeteorPersistence");
var BaseCollection = require("./BaseCollection");
var Serializer = require("./Serializer");
MeteorPersistence.init();
var TestPersonCollection = (function (_super) {
    __extends(TestPersonCollection, _super);
    function TestPersonCollection() {
        _super.call(this, TestPerson);
    }
    return TestPersonCollection;
})(BaseCollection);
exports.TestPersonCollection = TestPersonCollection;
var TestTreeCollection = (function (_super) {
    __extends(TestTreeCollection, _super);
    function TestTreeCollection() {
        _super.call(this, TestTree);
    }
    return TestTreeCollection;
})(BaseCollection);
exports.TestTreeCollection = TestTreeCollection;
var bc = new TestPersonCollection();
var tp = new TestPerson("tp1", "bert");
var value = Reflect.getMetadata("SubDocument", TestPerson.prototype, "phoneNumbers");
tp.addAddress(new TestAddress("1", "süd"));
tp.tree = new TestTree("tree1");
var s = Serializer.toDocument(tp);
var tp = Serializer.toObject(s, TestPerson);
console.log(tp.tree.getId());
//# sourceMappingURL=TestCollection.js.map