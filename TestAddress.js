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
var TestAddress = (function () {
    function TestAddress(street) {
        this.street = street;
    }
    TestAddress.prototype.getStreet = function () {
        return this.street;
    };
    TestAddress = __decorate([
        PersistenceAnnotation.Entity
    ], TestAddress);
    return TestAddress;
})();
module.exports = TestAddress;
//# sourceMappingURL=TestAddress.js.map