"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var omm = require("../../src/omm");
var TestCar = (function () {
    function TestCar() {
        this.wheels = [];
        this.privateToServer = 'itsPrivate';
    }
    __decorate([
        omm.Type("TestWheelBanzai")
    ], TestCar.prototype, "wheel", void 0);
    __decorate([
        omm.ArrayOrMap("TestWheelBanzai")
    ], TestCar.prototype, "wheels", void 0);
    __decorate([
        omm.Ignore
    ], TestCar.prototype, "temperature", void 0);
    __decorate([
        omm.PrivateToServer
    ], TestCar.prototype, "privateToServer", void 0);
    TestCar = __decorate([
        omm.Entity
    ], TestCar);
    return TestCar;
}());
exports.TestCar = TestCar;
//# sourceMappingURL=TestCar.js.map