/**
 * Created by bert on 04.05.15.
 */
if (typeof __decorate !== "function") __decorate = function (decorators, target, key, desc) {
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") return Reflect.decorate(decorators, target, key, desc);
    switch (arguments.length) {
        case 2: return decorators.reduceRight(function(o, d) { return (d && d(o)) || o; }, target);
        case 3: return decorators.reduceRight(function(o, d) { return (d && d(target, key)), void 0; }, void 0);
        case 4: return decorators.reduceRight(function(o, d) { return (d && d(target, key, o)) || o; }, desc);
    }
};
var PersistenceAnnotation = require("./PersistenceAnnotation");
var TestPhoneNumber = (function () {
    function TestPhoneNumber(n, p) {
        this.timesCalled = 0;
        this.number = n;
        this.person = p;
    }
    TestPhoneNumber.prototype.called = function () {
        this.timesCalled++;
    };
    TestPhoneNumber.prototype.getNumber = function () {
        return this.number;
    };
    TestPhoneNumber.prototype.getTimesCalled = function () {
        return this.timesCalled;
    };
    TestPhoneNumber = __decorate([
        PersistenceAnnotation.Entity
    ], TestPhoneNumber);
    return TestPhoneNumber;
})();
module.exports = TestPhoneNumber;
//# sourceMappingURL=TestPhoneNumber.js.map