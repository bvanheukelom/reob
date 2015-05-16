if (typeof __decorate !== "function") __decorate = function (decorators, target, key, desc) {
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") return Reflect.decorate(decorators, target, key, desc);
    switch (arguments.length) {
        case 2: return decorators.reduceRight(function(o, d) { return (d && d(o)) || o; }, target);
        case 3: return decorators.reduceRight(function(o, d) { return (d && d(target, key)), void 0; }, void 0);
        case 4: return decorators.reduceRight(function(o, d) { return (d && d(target, key, o)) || o; }, desc);
    }
};
Tests;
(function (Tests) {
    var TestTree = (function () {
        function TestTree(initialHeight) {
            this.height = 10;
            this.leaves = [];
            this.height = initialHeight || 10;
        }
        TestTree.prototype.grow = function () {
            this.height++;
            console.log("Tree is growing to new heights: ", this.height + " on the " + (Meteor.isServer ? "server" : "client"));
            this.leaves.push(new Tests.TestLeaf("leaf" + this.getHeight(), this));
            this.leaves.forEach(function (l) {
                l.grow();
            });
            if (Meteor.isClient)
                return "grown on the client";
            else
                return "grown on the server";
        };
        TestTree.prototype.wither = function () {
            this.leaves = [];
        };
        TestTree.prototype.getId = function () {
            return this._id;
        };
        TestTree.prototype.setId = function (i) {
            console.log("Setting tree id:" + i);
            this._id = i;
        };
        TestTree.prototype.getHeight = function () {
            return this.height;
        };
        TestTree.prototype.getLeaves = function () {
            return this.leaves;
        };
        __decorate([
            persistence.PersistenceAnnotation.ArrayOrMap("TestLeaf")
        ], TestTree.prototype, "leaves");
        Object.defineProperty(TestTree.prototype, "grow",
            __decorate([
                persistence.PersistenceAnnotation.Wrap
            ], TestTree.prototype, "grow", Object.getOwnPropertyDescriptor(TestTree.prototype, "grow")));
        Object.defineProperty(TestTree.prototype, "wither",
            __decorate([
                persistence.PersistenceAnnotation.Wrap
            ], TestTree.prototype, "wither", Object.getOwnPropertyDescriptor(TestTree.prototype, "wither")));
        TestTree = __decorate([
            persistence.PersistenceAnnotation.Entity("TheTreeCollection")
        ], TestTree);
        return TestTree;
    })();
    Tests.TestTree = TestTree;
})(Tests || (Tests = {}));
