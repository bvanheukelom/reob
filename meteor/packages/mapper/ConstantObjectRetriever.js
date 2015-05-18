///<reference path="./references.d.ts"/>
mapper;
(function (mapper) {
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
    mapper.ConstantObjectRetriever = ConstantObjectRetriever;
})(mapper || (mapper = {}));
//# sourceMappingURL=ConstantObjectRetriever.js.map
