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
    var TestAddress = (function () {
        function TestAddress(street) {
            this.street = street;
        }
        TestAddress.prototype.getStreet = function () {
            return this.street;
        };
        TestAddress.prototype.getId = function () {
            return this.street;
        };
        TestAddress = __decorate([
            mapper.Entity
        ], TestAddress);
        return TestAddress;
    })();
    Tests.TestAddress = TestAddress;
})(Tests || (Tests = {}));
//# sourceMappingURL=TestAddress.js.map