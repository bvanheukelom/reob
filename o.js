/**
 * Created by bert on 03.05.15.
 */
//class PersistenceInfo
//{
//    path:PersistencePath;
//}
var PersistedFunction = (function () {
    function PersistedFunction() {
    }
    return PersistedFunction;
})();
var ForeignKeyGetter = (function () {
    function ForeignKeyGetter() {
    }
    return ForeignKeyGetter;
})();
var PersistenceDescriptor = (function () {
    function PersistenceDescriptor() {
    }
    // TODO this is duplicate code, needs resolving. Didn't want this to depend on code that currently lives on the meteor side.
    PersistenceDescriptor.functionName = function (fun) {
        var ret = fun.toString();
        ret = ret.substr('function '.length);
        ret = ret.substr(0, ret.indexOf('('));
        return ret;
    };
    PersistenceDescriptor.prototype.getPersistedFunctionNames = function (c) {
        var result = [];
        for (var propertyName in c) {
            var property = c[propertyName];
            if (typeof property == "function" && property.persist == true) {
                result.push(propertyName);
            }
        }
        return result;
    };
    PersistenceDescriptor.persistAfterInvocation = function (fkt) {
        fkt.persist = true;
        //var functionName = PersistenceDescriptor.functionName(fkt);
        //var persistedFunction = new PersistedFunction();
        //persistedFunction.name = functionName;
        //persistedFunction.originalFunction = fkt;
        //this.persistedFunctions[functionName] = persistedFunction;
    };
    PersistenceDescriptor.persistAsIds = function (c, propertyName, referencedClass, lookupFunction) {
    };
    PersistenceDescriptor.ignoreProperties = function (c) {
        var propertyNames = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            propertyNames[_i - 1] = arguments[_i];
        }
    };
    PersistenceDescriptor.subDocumentClass = function (c, propertyName, referencedClass) {
        if (!c.persistenceDescriptor) {
            c.persistenceDescriptor = new PersistenceDescriptor();
        }
    };
    return PersistenceDescriptor;
})();
function SubDocument(className) {
    return function (target) {
        console.log("Classname " + className);
        Reflect.defineMetadata("SubDocument", className, target);
    };
}
