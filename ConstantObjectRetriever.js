///<reference path="references.d.ts"/>
var persistence;
(function (persistence) {
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
        return ConstantObjectRetriever;
    })();
    persistence.ConstantObjectRetriever = ConstantObjectRetriever;
})(persistence || (persistence = {}));
//# sourceMappingURL=ConstantObjectRetriever.js.map