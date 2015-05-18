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
    var TestPhoneNumber = (function () {
        function TestPhoneNumber(n) {
            this.number = n;
        }
        TestPhoneNumber.prototype.getNumber = function () {
            return this.number;
        };
        TestPhoneNumber.prototype.getId = function () {
            return this.number;
        };
        TestPhoneNumber.prototype.callNumber = function (callback) {
            var that = this;
            console.log("Calling a phone number : ", callback);
            setTimeout(function () {
                callback(undefined, "Called:" + that.number);
            }, 300);
        };
        TestPhoneNumber.prototype.callNumberFrantically = function (degreeOfUrgency, callback) {
            var that = this;
            console.log("Calling a phone number : ", callback);
            setTimeout(function () {
                callback(undefined, "Called:" + that.number + " " + degreeOfUrgency + " time(s)");
            }, 300);
        };
        Object.defineProperty(TestPhoneNumber.prototype, "callNumber",
            __decorate([
                mapper.Wrap
            ], TestPhoneNumber.prototype, "callNumber", Object.getOwnPropertyDescriptor(TestPhoneNumber.prototype, "callNumber")));
        TestPhoneNumber = __decorate([
            mapper.Entity
        ], TestPhoneNumber);
        return TestPhoneNumber;
    })();
    Tests.TestPhoneNumber = TestPhoneNumber;
})(Tests || (Tests = {}));
//# sourceMappingURL=TestPhoneNumber.js.map