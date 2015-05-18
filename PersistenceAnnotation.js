///<reference path="references.d.ts"/>
var persistence;
(function (persistence) {
    function Entity(p1) {
        if (typeof p1 == "string") {
            return function (target) {
                var typeClass = target;
                console.log("Entity(<class>) " + className(typeClass) + " with collection name:" + p1);
                Reflect.defineMetadata("persistence:collectionName", p1, typeClass);
                Reflect.defineMetadata("persistence:entity", true, typeClass);
                PersistencePrivate.entityClasses[className(typeClass)] = typeClass;
            };
        }
        if (typeof p1 == "boolean") {
            return function (target) {
                var typeClass = target;
                console.log("Entity(true) " + className(typeClass) + " with collection name:", className(typeClass));
                if (p1)
                    Reflect.defineMetadata("persistence:collectionName", className(typeClass), typeClass);
                Reflect.defineMetadata("persistence:entity", true, typeClass);
                PersistencePrivate.entityClasses[className(typeClass)] = typeClass;
            };
        }
        else if (typeof p1 == "function") {
            var typeClass = p1;
            console.log("Entity() " + className(typeClass));
            Reflect.defineMetadata("persistence:entity", true, typeClass);
            PersistencePrivate.entityClasses[className(typeClass)] = typeClass;
        }
    }
    persistence.Entity = Entity;
    function Wrap(t, functionName, objectDescriptor) {
        Reflect.defineMetadata("persistence:wrap", true, t[functionName]);
    }
    persistence.Wrap = Wrap;
    function ArrayOrMap(typeClassName) {
        return function (targetPrototypeObject, propertyName) {
            console.log("  " + propertyName + " as collection of " + typeClassName);
            PersistenceAnnotation.setPropertyProperty(targetPrototypeObject, propertyName, "type", typeClassName);
            PersistenceAnnotation.setPropertyProperty(targetPrototypeObject, propertyName, "arrayOrMap", true);
        };
    }
    persistence.ArrayOrMap = ArrayOrMap;
    function AsForeignKeys(targetPrototypeObject, propertyName) {
        return PersistenceAnnotation.setPropertyProperty(targetPrototypeObject, propertyName, "askeys", true);
    }
    persistence.AsForeignKeys = AsForeignKeys;
    function AsForeignKey(targetPrototypeObject, propertyName) {
        return AsForeignKeys(targetPrototypeObject, propertyName);
    }
    persistence.AsForeignKey = AsForeignKey;
    function Type(typeClassName) {
        return function (targetPrototypeObject, propertyName) {
            console.log("  " + propertyName + " as " + typeClassName);
            PersistenceAnnotation.setPropertyProperty(targetPrototypeObject, propertyName, "type", typeClassName);
        };
    }
    persistence.Type = Type;
    function className(fun) {
        var ret = fun.toString();
        ret = ret.substr('function '.length);
        ret = ret.substr(0, ret.indexOf('('));
        return ret;
    }
    persistence.className = className;
    var PersistenceAnnotation = (function () {
        function PersistenceAnnotation() {
        }
        PersistenceAnnotation.getClass = function (o) {
            if (o)
                return o.constructor;
            else
                return undefined;
        };
        PersistenceAnnotation.getEntityClassByName = function (className) {
            return PersistencePrivate.entityClasses[className];
        };
        PersistenceAnnotation.getCollectionClasses = function () {
            var result = [];
            for (var i in PersistencePrivate.entityClasses) {
                var entityClass = PersistencePrivate.entityClasses[i];
                if (PersistenceAnnotation.getCollectionName(entityClass))
                    result.push(entityClass);
            }
            return result;
        };
        PersistenceAnnotation.getEntityClasses = function () {
            var result = [];
            for (var i in PersistencePrivate.entityClasses) {
                var entityClass = PersistencePrivate.entityClasses[i];
                result.push(entityClass);
            }
            return result;
        };
        PersistenceAnnotation.getCollectionName = function (f) {
            return Reflect.getMetadata("persistence:collectionName", f);
        };
        PersistenceAnnotation.isRootEntity = function (f) {
            return !!PersistenceAnnotation.getCollectionName(f);
        };
        PersistenceAnnotation.isEntity = function (f) {
            return !!PersistencePrivate.entityClasses[className(f)];
        };
        PersistenceAnnotation.isArrayOrMap = function (typeClass, propertyName) {
            return PersistenceAnnotation.getPropertyProperty(typeClass.prototype, propertyName, "arrayOrMap") == true;
        };
        PersistenceAnnotation.getPropertyClass = function (f, propertyName) {
            var className = PersistenceAnnotation.getPropertyProperty(f.prototype, propertyName, "type");
            if (!className)
                return undefined;
            else
                return PersistenceAnnotation.getEntityClassByName(className);
        };
        PersistenceAnnotation.getTypedPropertyNames = function (f) {
            var result = [];
            var props = Reflect.getMetadata("persistence:typedproperties", f.prototype);
            for (var i in props) {
                if (PersistenceAnnotation.getPropertyClass(f, i))
                    result.push(i);
            }
            return result;
        };
        PersistenceAnnotation.setPropertyProperty = function (targetPrototypeObject, propertyName, property, value) {
            var arr = Reflect.getMetadata("persistence:typedproperties", targetPrototypeObject);
            if (!arr) {
                arr = {};
                Reflect.defineMetadata("persistence:typedproperties", arr, targetPrototypeObject);
            }
            var propProps = arr[propertyName];
            if (!propProps) {
                propProps = {};
                arr[propertyName] = propProps;
            }
            propProps[property] = value;
        };
        PersistenceAnnotation.getPropertyProperty = function (targetPrototypeObject, propertyName, propertyProperty) {
            var arr = Reflect.getMetadata("persistence:typedproperties", targetPrototypeObject);
            if (arr && arr[propertyName]) {
                return arr[propertyName][propertyProperty];
            }
            return undefined;
        };
        PersistenceAnnotation.isStoredAsForeignKeys = function (typeClass, propertyName) {
            return PersistenceAnnotation.getPropertyProperty(typeClass.prototype, propertyName, "askeys");
        };
        PersistenceAnnotation.getWrappedFunctionNames = function (f) {
            return PersistenceAnnotation.getPropertyNamesByMetaData(f.prototype, "persistence:wrap");
        };
        PersistenceAnnotation.getPropertyNamesByMetaData = function (o, metaData) {
            var result = [];
            for (var i in o) {
                var value = o[i];
                if (typeof value == "function" && Reflect.getMetadata(metaData, value))
                    result.push(i);
            }
            return result;
        };
        return PersistenceAnnotation;
    })();
    persistence.PersistenceAnnotation = PersistenceAnnotation;
    var PersistencePrivate = (function () {
        function PersistencePrivate() {
        }
        PersistencePrivate.entityClasses = {};
        return PersistencePrivate;
    })();
})(persistence || (persistence = {}));
//# sourceMappingURL=PersistenceAnnotation.js.map