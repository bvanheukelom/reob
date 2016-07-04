"use strict";
var ConstantObjectRetriever = (function () {
    function ConstantObjectRetriever(o) {
        this.value = o;
    }
    ConstantObjectRetriever.prototype.getId = function (o) {
        return "constant";
    };
    ConstantObjectRetriever.prototype.getObject = function (s) {
        return this.value;
    };
    ConstantObjectRetriever.prototype.preToDocument = function (o) { };
    ConstantObjectRetriever.prototype.postToObject = function (o) { };
    return ConstantObjectRetriever;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ConstantObjectRetriever;
//# sourceMappingURL=ConstantObjectRetriever.js.map