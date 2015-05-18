var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
///<reference path="references.d.ts"/>
var TestPersonCollection = (function (_super) {
    __extends(TestPersonCollection, _super);
    function TestPersonCollection() {
        _super.call(this, Tests.TestPerson);
    }
    TestPersonCollection.prototype.newPerson = function (n, callback) {
        var p = new Tests.TestPerson();
        p.name = n;
        var that = this;
        this.insert(p, function (e, id) {
            callback(e, id ? that.getById(id) : undefined);
        });
    };
    TestPersonCollection.prototype.haveBaby = function (mom, dad, callback) {
        console.log("mom: ", mom);
        console.log("dad: ", dad);
        var kid = new Tests.TestPerson();
        kid.name = "child of " + mom.name + " and " + dad.name;
        kid.family["mom"] = mom;
        kid.family["dad"] = dad;
        var that = this;
        this.insert(kid, function (e, id) {
            console.log("The baby is inserted into the database");
            callback(e, id ? that.getById(id) : undefined);
        });
    };
    TestPersonCollection.prototype.removePerson = function (id, callback) {
        this.remove(id, callback);
    };
    return TestPersonCollection;
})(persistence.BaseCollection);
if (Meteor.isServer) {
    Meteor.publish("persons", function () {
        return persistence.MeteorPersistence.collections["TestPerson"].getMeteorCollection().find({});
    });
}
else {
    Meteor.subscribe("persons");
}
persistence.MeteorPersistence.wrapFunction(TestPersonCollection.prototype, "removePerson", "removePerson", true, null, new persistence.ConstantObjectRetriever(new TestPersonCollection()));
persistence.MeteorPersistence.wrapFunction(TestPersonCollection.prototype, "newPerson", "newPerson", true, new DeSerializer.Serializer(new persistence.MeteorObjectRetriever()), new persistence.ConstantObjectRetriever(new TestPersonCollection()));
persistence.MeteorPersistence.wrapFunction(TestPersonCollection.prototype, "haveBaby", "haveBaby", true, new DeSerializer.Serializer(new persistence.MeteorObjectRetriever()), new persistence.ConstantObjectRetriever(new TestPersonCollection()));
//# sourceMappingURL=TestPersonCollection.js.map