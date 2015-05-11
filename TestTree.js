if (typeof __decorate !== "function") __decorate = function (decorators, target, key, desc) {
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") return Reflect.decorate(decorators, target, key, desc);
    switch (arguments.length) {
        case 2: return decorators.reduceRight(function(o, d) { return (d && d(o)) || o; }, target);
        case 3: return decorators.reduceRight(function(o, d) { return (d && d(target, key)), void 0; }, void 0);
        case 4: return decorators.reduceRight(function(o, d) { return (d && d(target, key, o)) || o; }, desc);
    }
};
var Tests;
(function (Tests) {
    var TestTree = (function () {
        function TestTree(id) {
            this.height = 10;
            this.leaves = [];
            this._id = id;
        }
        TestTree.prototype.grow = function () {
            this.height++;
            console.log("Tree is growing to new heights: ", this.height);
            this.leaves.push(new Tests.TestLeaf("leaf" + this.getHeight(), this));
            this.leaves.forEach(function (l) {
                l.grow();
            });
        };
        TestTree.prototype.getId = function () {
            return this._id;
        };
        TestTree.prototype.getHeight = function () {
            return this.height;
        };
        TestTree.prototype.getLeaves = function () {
            return this.leaves;
        };
        __decorate([
            persistence
                .
                    PersistenceAnnotation
                .
                    ArrayOrMap("TestLeaf")
        ], TestTree.prototype, "leaves");
        Object.defineProperty(TestTree.prototype, "grow",
            __decorate([
                persistence
                    .
                        PersistenceAnnotation
                    .
                        Wrap
            ], TestTree.prototype, "grow", Object.getOwnPropertyDescriptor(TestTree.prototype, "grow")));
        TestTree = __decorate([
            persistence.PersistenceAnnotation.Entity("TestTree")
        ], TestTree);
        return TestTree;
    })();
    Tests.TestTree = TestTree;
})(Tests || (Tests = {}));
//# sourceMappingURL=TestTree.js.map