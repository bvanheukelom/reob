/**
 * Created by bert on 04.05.15.
 */
var PersistenceAnnotation = require("./PersistenceAnnotation");
var PersistenceInfo = (function () {
    function PersistenceInfo() {
    }
    return PersistenceInfo;
})();
var MeteorPersistence = (function () {
    function MeteorPersistence() {
    }
    MeteorPersistence.init = function () {
        var allClasses = PersistenceAnnotation.getCollectionClasses();
        for (var i in allClasses) {
            var ctor = allClasses[i];
            PersistenceAnnotation.getSubDocumentPropertyNames(ctor);
        }
    };
    return MeteorPersistence;
})();
module.exports = MeteorPersistence;
//# sourceMappingURL=MeteorPersistence.js.map