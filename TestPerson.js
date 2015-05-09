if (typeof __decorate !== "function") __decorate = function (decorators, target, key, desc) {
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") return Reflect.decorate(decorators, target, key, desc);
    switch (arguments.length) {
        case 2: return decorators.reduceRight(function(o, d) { return (d && d(o)) || o; }, target);
        case 3: return decorators.reduceRight(function(o, d) { return (d && d(target, key)), void 0; }, void 0);
        case 4: return decorators.reduceRight(function(o, d) { return (d && d(target, key, o)) || o; }, desc);
    }
};
/**
 * Created by bert on 04.05.15.
 */
var PersistenceAnnotation = require("./PersistenceAnnotation");
var TestAddress = require("./TestAddress");
var TestPerson = (function () {
    function TestPerson(id, name) {
        this.addresses = [];
        this._id = id;
        this.name = name;
    }
    TestPerson.prototype.getId = function () {
        return this._id;
    };
    TestPerson.prototype.addAddress = function (a) {
        console.log("inside add address:", (a instanceof TestAddress));
        this.addresses.push(a);
    };
    TestPerson.prototype.rename = function (n) {
        this.name = n;
    };
    TestPerson.prototype.getName = function () {
        return this.name;
    };
    //getAddressById(id:String):TestAddress
    //{
    //    for( var i=0;i<this.addresses.length; i++ )
    //    {
    //        var address = this.addresses[i];
    //        if( address.getId()==id )
    //            return address;
    //    }
    //}
    TestPerson.prototype.getAddresses = function () {
        return this.addresses;
    };
    TestPerson.prototype.getTree = function () {
        return this.tree;
    };
    TestPerson.prototype.collectLeaf = function () {
        this.leaf = this.tree.getLeaves()[0];
    };
    __decorate([
        PersistenceAnnotation.Type("TestPhoneNumber")
    ], TestPerson.prototype, "phoneNumber");
    __decorate([
        PersistenceAnnotation.Type("TestAddress")
    ], TestPerson.prototype, "addresses");
    __decorate([
        PersistenceAnnotation.Type("TestTree"),
        PersistenceAnnotation.AsForeignKeys
    ], TestPerson.prototype, "tree");
    Object.defineProperty(TestPerson.prototype, "addAddress",
        __decorate([
            PersistenceAnnotation.Wrap
        ], TestPerson.prototype, "addAddress", Object.getOwnPropertyDescriptor(TestPerson.prototype, "addAddress")));
    Object.defineProperty(TestPerson.prototype, "collectLeaf",
        __decorate([
            PersistenceAnnotation.Wrap
        ], TestPerson.prototype, "collectLeaf", Object.getOwnPropertyDescriptor(TestPerson.prototype, "collectLeaf")));
    TestPerson = __decorate([
        PersistenceAnnotation.Entity(true)
    ], TestPerson);
    return TestPerson;
})();
module.exports = TestPerson;
//# sourceMappingURL=TestPerson.js.map