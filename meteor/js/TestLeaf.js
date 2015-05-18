/**
 * Created by bert on 07.05.15.
 */
if (typeof __decorate !== "function") __decorate = function (decorators, target, key, desc) {
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") return Reflect.decorate(decorators, target, key, desc);
    switch (arguments.length) {
        case 2: return decorators.reduceRight(function(o, d) { return (d && d(o)) || o; }, target);
        case 3: return decorators.reduceRight(function(o, d) { return (d && d(target, key)), void 0; }, void 0);
        case 4: return decorators.reduceRight(function(o, d) { return (d && d(target, key, o)) || o; }, desc);
    }
};
///<reference path="./references.d.ts"/>
var Tests;
(function (Tests) {
    var TestLeaf = (function () {
        function TestLeaf(id, parent) {
            this._id = id;
            this.greenNess = 1;
            this.parent = parent;
        }
        TestLeaf.prototype.getId = function () {
            return this._id;
        };
        TestLeaf.prototype.grow = function () {
            this.greenNess++;
        };
        TestLeaf.prototype.getTree = function () {
            return this.parent;
        };
        __decorate([
            mapper.Type("TestTree"),
            mapper.AsForeignKey
        ], TestLeaf.prototype, "parent");
        TestLeaf = __decorate([
            mapper.Entity
        ], TestLeaf);
        return TestLeaf;
    })();
    Tests.TestLeaf = TestLeaf;
})(Tests || (Tests = {}));
//# sourceMappingURL=TestLeaf.js.map