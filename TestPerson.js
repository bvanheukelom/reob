if (typeof __decorate !== "function") __decorate = function (decorators, target, key, desc) {
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") return Reflect.decorate(decorators, target, key, desc);
    switch (arguments.length) {
        case 2: return decorators.reduceRight(function(o, d) { return (d && d(o)) || o; }, target);
        case 3: return decorators.reduceRight(function(o, d) { return (d && d(target, key)), void 0; }, void 0);
        case 4: return decorators.reduceRight(function(o, d) { return (d && d(target, key, o)) || o; }, desc);
    }
};
///<reference path="references.d.ts"/>
var Tests;
(function (Tests) {
    var TestPerson = (function () {
        function TestPerson(id, name) {
            this.addresses = [];
            this.trees = [];
            this.phoneBook = {};
            this.wood = {};
            this.family = {};
            this._id = id;
            this.name = name;
        }
        TestPerson.prototype.getId = function () {
            return this._id;
        };
        TestPerson.prototype.setId = function (id) {
            this._id = id;
        };
        TestPerson.prototype.addAddress = function (a) {
            console.log("inside add address:", (a instanceof Tests.TestAddress));
            this.addresses.push(a);
            return a;
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
            console.log("collecting leaf:", this.tree);
            this.leaf = this.tree.getLeaves()[0];
        };
        TestPerson.prototype.chooseTree = function (t) {
            console.log("choosing tree:", t);
            this.tree = t;
        };
        TestPerson.prototype.chooseLeaf = function (l) {
            this.leaf = l;
        };
        TestPerson.prototype.addToWood = function (t, s) {
            this.trees.push(t);
            if (s)
                this.wood[s] = t;
        };
        TestPerson.prototype.addFamilyRelation = function (s, p) {
            if (s)
                this.family[s] = p;
        };
        TestPerson.prototype.addPhoneNumber = function (s, p) {
            this.phoneBook[s] = p;
        };
        __decorate([
            persistence.Type("TestPhoneNumber")
        ], TestPerson.prototype, "phoneNumber");
        __decorate([
            persistence.ArrayOrMap("TestAddress")
        ], TestPerson.prototype, "addresses");
        __decorate([
            persistence.Type("TestTree"),
            persistence.AsForeignKeys
        ], TestPerson.prototype, "tree");
        __decorate([
            persistence.Type("TestLeaf"),
            persistence.AsForeignKeys
        ], TestPerson.prototype, "leaf");
        __decorate([
            persistence.ArrayOrMap("TestLeaf"),
            persistence.AsForeignKeys
        ], TestPerson.prototype, "trees");
        __decorate([
            persistence.ArrayOrMap("TestPhoneNumber")
        ], TestPerson.prototype, "phoneBook");
        __decorate([
            persistence.ArrayOrMap("TestTree"),
            persistence.AsForeignKeys
        ], TestPerson.prototype, "wood");
        __decorate([
            persistence.ArrayOrMap("TestPerson"),
            persistence.AsForeignKeys
        ], TestPerson.prototype, "family");
        Object.defineProperty(TestPerson.prototype, "addAddress",
            __decorate([
                persistence.Wrap
            ], TestPerson.prototype, "addAddress", Object.getOwnPropertyDescriptor(TestPerson.prototype, "addAddress")));
        Object.defineProperty(TestPerson.prototype, "collectLeaf",
            __decorate([
                persistence.Wrap
            ], TestPerson.prototype, "collectLeaf", Object.getOwnPropertyDescriptor(TestPerson.prototype, "collectLeaf")));
        Object.defineProperty(TestPerson.prototype, "chooseTree",
            __decorate([
                persistence.Wrap
            ], TestPerson.prototype, "chooseTree", Object.getOwnPropertyDescriptor(TestPerson.prototype, "chooseTree")));
        Object.defineProperty(TestPerson.prototype, "chooseLeaf",
            __decorate([
                persistence.Wrap
            ], TestPerson.prototype, "chooseLeaf", Object.getOwnPropertyDescriptor(TestPerson.prototype, "chooseLeaf")));
        Object.defineProperty(TestPerson.prototype, "addToWood",
            __decorate([
                persistence.Wrap
            ], TestPerson.prototype, "addToWood", Object.getOwnPropertyDescriptor(TestPerson.prototype, "addToWood")));
        Object.defineProperty(TestPerson.prototype, "addFamilyRelation",
            __decorate([
                persistence.Wrap
            ], TestPerson.prototype, "addFamilyRelation", Object.getOwnPropertyDescriptor(TestPerson.prototype, "addFamilyRelation")));
        Object.defineProperty(TestPerson.prototype, "addPhoneNumber",
            __decorate([
                persistence.Wrap
            ], TestPerson.prototype, "addPhoneNumber", Object.getOwnPropertyDescriptor(TestPerson.prototype, "addPhoneNumber")));
        TestPerson = __decorate([
            persistence.Entity(true)
        ], TestPerson);
        return TestPerson;
    })();
    Tests.TestPerson = TestPerson;
})(Tests || (Tests = {}));
//# sourceMappingURL=TestPerson.js.map