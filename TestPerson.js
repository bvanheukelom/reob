if (typeof __decorate !== "function") __decorate = function (decorators, target, key, desc) {
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") return Reflect.decorate(decorators, target, key, desc);
    switch (arguments.length) {
        case 2: return decorators.reduceRight(function(o, d) { return (d && d(o)) || o; }, target);
        case 3: return decorators.reduceRight(function(o, d) { return (d && d(target, key)), void 0; }, void 0);
        case 4: return decorators.reduceRight(function(o, d) { return (d && d(target, key, o)) || o; }, desc);
    }
};
///<reference path="references.d.ts"/>
var TestPerson = (function () {
    function TestPerson(id, name) {
        this.addresses = [];
        this.trees = [];
        this.phoneBook = {};
        this.wood = {};
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
        persistence.PersistenceAnnotation.Type("TestPhoneNumber")
    ], TestPerson.prototype, "phoneNumber");
    __decorate([
        persistence.PersistenceAnnotation.ArrayOrMap("TestAddress")
    ], TestPerson.prototype, "addresses");
    __decorate([
        persistence.PersistenceAnnotation.Type("TestTree"),
        persistence.PersistenceAnnotation.AsForeignKeys
    ], TestPerson.prototype, "tree");
    __decorate([
        persistence.PersistenceAnnotation.Type("TestLeaf"),
        persistence.PersistenceAnnotation.AsForeignKeys
    ], TestPerson.prototype, "leaf");
    __decorate([
        persistence.PersistenceAnnotation.ArrayOrMap("TestLeaf"),
        persistence.PersistenceAnnotation.AsForeignKeys
    ], TestPerson.prototype, "trees");
    __decorate([
        persistence.PersistenceAnnotation.ArrayOrMap("TestPhoneNumber")
    ], TestPerson.prototype, "phoneBook");
    __decorate([
        persistence.PersistenceAnnotation.ArrayOrMap("TestTree"),
        persistence.PersistenceAnnotation.AsForeignKeys
    ], TestPerson.prototype, "wood");
    Object.defineProperty(TestPerson.prototype, "addAddress",
        __decorate([
            persistence.PersistenceAnnotation.Wrap
        ], TestPerson.prototype, "addAddress", Object.getOwnPropertyDescriptor(TestPerson.prototype, "addAddress")));
    Object.defineProperty(TestPerson.prototype, "collectLeaf",
        __decorate([
            persistence.PersistenceAnnotation.Wrap
        ], TestPerson.prototype, "collectLeaf", Object.getOwnPropertyDescriptor(TestPerson.prototype, "collectLeaf")));
    TestPerson = __decorate([
        persistence.PersistenceAnnotation.Entity(true)
    ], TestPerson);
    return TestPerson;
})();
//# sourceMappingURL=TestPerson.js.map