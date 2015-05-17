__extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
///<reference path="references.d.ts"/>
TestPersonCollection = (function (_super) {
    __extends(TestPersonCollection, _super);
    function TestPersonCollection() {
        _super.call(this, Tests.TestPerson);
    }
    TestPersonCollection.prototype.newPerson = function (n, callback) {
        var p = new Tests.TestPerson();
        p.name = n;
        try {
            var id = this.insert(p);
            if (!this.getById(id))
                throw new Error("Could not insert person.");
            callback(undefined, this.getById(id));
        }
        catch (e) {
            callback(e);
        }
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
persistence.MeteorPersistence.wrapFunction(TestPersonCollection.prototype, "newPerson", "newPerson", true, new DeSerializer.Serializer(new persistence.MeteorObjectRetriever()), new persistence.ConstantObjectRetriever(new TestPersonCollection()));
