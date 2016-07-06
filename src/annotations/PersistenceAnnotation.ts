
export interface IMethodOptions{
    name?:string;
    parameterTypes?:Array<string>;
    parentObject?:any;
    resultType?:string;
    replaceWithCall?:boolean;
    serverOnly?:boolean;
}
/**
 * The omm module
 * @namespace omm
 */

    // TODO rename to something that contains the word "Entity"
    export interface TypeClass<T> {
        new(): T ;
        //toDocument?( o:T ):Document;
        //toObject?( doc:Document ):T;
    }


    export class EventContext<T> {
        private  cancelledError:any = false;
        preUpdate:T;
        object:T;
        objectId:string;
        collection:any; //omm.Collection<T>;
        rootObject:any;
        methodContext:any;
        functionName:string;
        serializationPath:any; //omm.SerializationPath;
        topic:string;

        constructor(o:T, coll:any /*omm.Collection<T>*/) {
            this.object = o;
            if( o )
                this.objectId = getId(o);
            this.collection = coll;
        }

        cancel(err:any):void {
            this.cancelledError = err;
        }

        cancelledWithError():any {
            return this.cancelledError;
        }
    }

    export interface EventListener {
        (i:EventContext<any>, data?:any) : void
    }


    export function isRegisteredWithKey( o:any ):string{
        for( var i  in registeredObjects ){
            if( registeredObjects[i] === o ){
                return i;
            }
        }
        return undefined;
    }

    export var entityClasses:{[index:string]:TypeClass<Object>};
    export var registeredObjects:{[index:string]:any};
    export var eventListeners:{ [index:string] : { [index:string] : Array<EventListener>} };
    export var meteorMethodFunctions:Array<IMethodOptions>;

    export function setNonEnumerableProperty(obj:Object, propertyName:string, value:any):void {
        if (!Object.getOwnPropertyDescriptor(obj, propertyName)) {
            Object.defineProperty(obj, propertyName, {
                configurable: false,
                enumerable: false,
                writable: true
            });
        }
        obj[propertyName] = value;
    }

    // it seems that the local variable that "reflect" uses is prone to the same difficulties when it gets loaded
    // multiple times. This is why it's been removed until it is supported by the Runtime directly.
    export function defineMetadata(propertyName, value, cls) {
        if (!cls.hasOwnProperty("_ommAnnotations")) {
            setNonEnumerableProperty(cls, "_ommAnnotations", {});
        }
        var _ommAnnotations = cls._ommAnnotations;
        _ommAnnotations[propertyName] = value;
    }

    export function getMetadata(propertyName, cls) {
        if (cls.hasOwnProperty("_ommAnnotations"))
            return cls["_ommAnnotations"][propertyName];
        else {
            return undefined;
        }
    }

    export function Entity(entityNameOrP1?:any):any {
        var entityName;
        if (typeof entityNameOrP1 == "string") {
            entityName = entityNameOrP1;
        } else {
            if( entityNameOrP1.name ){
                entityName = entityNameOrP1.name;
            }else {
                var n = entityNameOrP1.toString();
                n = n.substr('function '.length);
                n = n.substr(0, n.indexOf('('));
                entityName = n;
            }
        }
        var f = function (p1:any) {
            var typeClass:TypeClass<Object> = <TypeClass<Object>>p1;
            defineMetadata("persistence:entity", true, typeClass);
            console.log("Adding entity ", entityName );
            entityClasses[entityName] = typeClass;
            Object.defineProperty(p1, "_ommClassName", {
                value: entityName,
                writable: false,
                configurable: false,
                enumerable: false
            });
        };
        if (typeof entityNameOrP1 == "string") {
            return f;
        } else {
            f(entityNameOrP1);
        }
    }

    /**
     * Declares a class as an entity.
     * @param c {function} The constructor function of the entity class.
     * @memberof omm
     */
    export function addEntity(c:TypeClass<Object>) {
        Entity(c);
    }

    export function getDefaultCollectionName(t:TypeClass<any>):string {
        return className(t);
    }

    export function addCollectionRoot(t:TypeClass<any>, collectionName:string) {
        defineMetadata("persistence:collectionName", collectionName, t);
    }

    export function Wrap(t:any, functionName:string, objectDescriptor:any) {
        //CollectionUpdate(t,functionName,objectDescriptor);
        //MeteorMethod(t,functionName,objectDescriptor);
        //defineMetadata("persistence:wrap", true, (<any>t)[functionName] );
        CollectionUpdate(t, functionName);
        MeteorMethod({replaceWithCall: true})(t, functionName, objectDescriptor);
    }

    // js api
    export function wrap(t:TypeClass<any>, functionName:string) {
        collectionUpdate(t, functionName);
        MeteorMethod({replaceWithCall: true})(t, functionName, undefined);
    }

    export function CollectionUpdate(p1:any, fName?:string) {
        var options = {};
        console.log("registering a collection update on property", fName, p1 );
        if (fName) {
            PersistenceAnnotation.setPropertyProperty(p1, fName, "collectionUpdate", options);
        }
        else {
            return function (t:any, functionName:string, objectDescriptor:any) {
                options = p1;
                PersistenceAnnotation.setPropertyProperty(<any>t, functionName, "collectionUpdate", options);
            };
        }
    }

    /**
     * Used to declare a function of a class as a "collection update". That means that whenever the function is called
     * the same operation is also invoked on the document in the collection.
     * @param c {function} The constructor function of the entity class.
     * @param functionName {string} The name of the function that is declared as a "collection update".
     * @param options
     * @memberof omm
     */
    export function collectionUpdate(c:TypeClass<any>, functionName:string, options?:any) {
        if (!options) {
            CollectionUpdate(c, functionName);
        } else {
            (<any>CollectionUpdate(options))(c, functionName);
        }
    }


    export function ArrayOrMap(typeClassName:string) {
        return function (targetPrototypeObject:any, propertyName:string) {
            // console.log("  "+propertyName+" as collection of "+typeClassName);
            PersistenceAnnotation.setPropertyProperty(targetPrototypeObject, propertyName, "type", typeClassName);
            PersistenceAnnotation.setPropertyProperty(targetPrototypeObject, propertyName, "arrayOrMap", true);
        };
    }


    export function ArrayType(typeClassName:string) {
        return ArrayOrMap(typeClassName);
    }

    /**
     * Declares the type of the values in the array. This is synonymous to {@link dictionaryType}.
     * @param c {function} The constructor function of the entity class.
     * @param propertyName {string} The name of the array property.
     * @param typeClassName {string} The classname of the entity that the array contains.
     * @memberof omm
     */
    export function arrayType(c:TypeClass<Object>, propertyName:string, typeClassName:string) {
        ArrayOrMap(typeClassName)(c.prototype, propertyName);
    }

    export function DictionaryType(typeClassName:string) {
        return ArrayOrMap(typeClassName);
    }

    /**
     * Declares the type of the values in the dictionary. This is synonymous to {@link arrayType}.
     * @param c {function} The constructor function of the entity class.
     * @param propertyName {string} The name of the array property.
     * @param typeClassName {string} The classname of the entity that the array contains.
     * @memberof omm
     */
    export function dictionaryType(typeClassName:string) {
        return ArrayOrMap(typeClassName);
    }

    // export function AsForeignKeys(targetPrototypeObject:any, propertyName:string) {
    //     return PersistenceAnnotation.setPropertyProperty(targetPrototypeObject.constructor, propertyName, "askeys", true);
    // }

    export function Id(targetPrototypeObject:any, propertyName:string) {
        DocumentName("_id")(targetPrototypeObject, propertyName);
    }

    export function Parent(targetPrototypeObject:any, propertyName:string) {
        PersistenceAnnotation.setPropertyProperty(targetPrototypeObject, propertyName, "parent", 1);
    }

    /**
     * Used to declare which property is used as the value for "_id".
     * @param c {function} The constructor function of the entity class.
     * @param propertyName {string} The name of the id property.
     * @memberof omm
     */
    export function idProperty(c:TypeClass<Object>, propertyName:string) {
        Id(c.prototype, propertyName);
    }

    export function Ignore(targetPrototypeObject:any, propertyName:string) {
        PersistenceAnnotation.setPropertyProperty(targetPrototypeObject, propertyName, "ignore", true);
    }

    /**
     * Declares that a property of an entity is not persisted.
     * @param c {function} The constructor function of the entity class.
     * @param propertyName {string} The name of the id property.
     * @memberof omm
     */
    export function ignoreProperty(c:TypeClass<Object>, propertyName:string) {
        Ignore(c.prototype, propertyName);
    }


    export function DocumentName(name:string) {
        return function (targetPrototypeObject:any, propertyName:string) {
            var objNames:any = getMetadata("objectNames", targetPrototypeObject);
            if (!objNames) {
                objNames = {};
                defineMetadata("objectNames", objNames, targetPrototypeObject);
            }
            var documentNames:any = getMetadata("documentNames", targetPrototypeObject);
            if (!documentNames) {
                documentNames = {};
                defineMetadata("documentNames", documentNames, targetPrototypeObject);
            }
            objNames[name] = propertyName;
            documentNames[propertyName] = name;
        }
    }


    // for grammar reasons
    // export function AsForeignKey(targetPrototypeObject:any, propertyName:string) {
    //     return AsForeignKeys(targetPrototypeObject, propertyName);
    // }

    export function Type(typeClassName:string) {
        return function (targetPrototypeObject:any, propertyName:string) {
            console.log("Registering a type  "+propertyName+" as "+typeClassName, " on ",targetPrototypeObject);
            PersistenceAnnotation.setPropertyProperty(targetPrototypeObject, propertyName, "type", typeClassName);
        };
    }

    export function type(t:TypeClass<Object>, propertyName:string, className:string) {
        Type(className)(t.prototype, propertyName);
    }

    // plain js api
    export function propertyType(t:TypeClass<Object>, propertyName:string, typeClassName:string) {
        Type(typeClassName)(t.prototype, propertyName);
    }

    export function propertyArrayType(t:TypeClass<Object>, propertyName:string, typeClassName:string) {
        ArrayType(typeClassName)(t.prototype, propertyName);
    }

    export function propertyDictionaryType(t:TypeClass<Object>, propertyName:string, typeClassName:string) {
        DictionaryType(typeClassName)(t.prototype, propertyName);
    }

    /**
     * Returns the property previously defined with {@link idProperty} or the _id property.
     * @param o {Object} the object
     * @returns {any}
     * @memberof omm
     */
    export function getId(o:Object) {
        var idPropertyName = PersistenceAnnotation.getIdPropertyName(PersistenceAnnotation.getClass(o));
        if (!idPropertyName)
            throw new Error("No id property defined for object of class " + PersistenceAnnotation.getClass(o));
        else
            return o[idPropertyName];
    }

    export function className(fun:TypeClass<Object>):string {
        return typeof fun == "function" ? fun['_ommClassName'] : undefined;
    }

    export function MeteorMethod(p1:any, p2?:any) {
        if (typeof p1 == "object" && typeof p2 == "string") {
            var options:IMethodOptions = { };
            options.parentObject = p1;
            options.name = p2;
            meteorMethodFunctions.push(options);
        } else {
            return function (t:any, functionName:string, objectDescriptor:any) {
                var options:IMethodOptions = {};
                if (typeof p1 == "object")
                    options = p1;
                else if (typeof p1 == "string") {
                    if (typeof p2 == "object")
                        options = p2;
                    options.name = p1;
                }
                options.parentObject = t;
                if (!options.name) {
                    options.name = functionName;
                }
                meteorMethodFunctions.push(options);
            };
        }
    }

    export class PersistenceAnnotation {
        public static getMethodOptions(functionName:string):IMethodOptions {
            for (var i = 0; i < meteorMethodFunctions.length; i++) {
                if (meteorMethodFunctions[i].name == functionName)
                    return meteorMethodFunctions[i];
            }
            return undefined;
        }

        public static getMethodFunctionNames<T extends Object>(c:any):Array<string> {
            var ret = [];
            for (var i = 0; i < meteorMethodFunctions.length; i++) {
                var methodOptions:IMethodOptions = meteorMethodFunctions[i];
                if (methodOptions.parentObject == c)
                    ret.push(methodOptions.name);
            }
            return ret;
        }

        public static getMethodFunctionNamesByObject<T extends Object>(o:any):Array<string> {
            var ret = [];
            for (var i = 0; i < meteorMethodFunctions.length; i++) {
                var methodOptions:IMethodOptions = meteorMethodFunctions[i];
                if (methodOptions.parentObject == o)
                    ret.push(meteorMethodFunctions[i].name);
            }
            return ret;
        }

        public static getAllMethodFunctionNames():Array<string> {
            var ret = [];
            for (var i = 0; i < meteorMethodFunctions.length; i++) {
                ret.push(meteorMethodFunctions[i].name);
            }
            return ret;
        }

        static getClass<T extends Object>(o:T):TypeClass<T> {
            if (o)
                return <TypeClass<T>>o.constructor;
            else
                return undefined;
        }

        // ---- Entity ----

        static getEntityClassByName(className:string):TypeClass<any> {
            return entityClasses[className];
        }

        public static getCollectionClasses():Array<TypeClass<Object>> {
            var result:Array<TypeClass<Object>> = [];
            for (var i in entityClasses) {
                var entityClass = entityClasses[i];
                if (PersistenceAnnotation.getCollectionName(entityClass))
                    result.push(entityClass);
            }
            return result;
        }

        public static getEntityClasses():Array<TypeClass<Object>> {
            var result:Array<TypeClass<Object>> = [];
            for (var i in entityClasses) {
                var entityClass = entityClasses[i];
                result.push(entityClass);
            }
            return result;
        }

        static getCollectionName(f:TypeClass<any>):string {
            return getMetadata("persistence:collectionName", f);
        }

        static isRootEntity(f:TypeClass<any>):boolean {
            return !!PersistenceAnnotation.getCollectionName(f);
        }

        static isEntity(f:TypeClass<any>):boolean {
            return !!entityClasses[className(f)];
        }

        static getDocumentPropertyName(typeClass:TypeClass<any>, objectPropertyName:string):string {
            var documentNames = getMetadata("documentNames", typeClass.prototype);
            return documentNames ? documentNames[objectPropertyName] : undefined;
        }

        static getObjectPropertyName(typeClass:TypeClass<any>, documentPropertyName:string):string {
            var objectNames = getMetadata("objectNames", typeClass.prototype);
            return objectNames ? objectNames[documentPropertyName] : undefined;
        }

        static isArrayOrMap(f:TypeClass<any>, propertyName:string):boolean {
            while (f != Object) {
                if (PersistenceAnnotation.getPropertyProperty(f, propertyName, "arrayOrMap"))
                    return true;
                f = PersistenceAnnotation.getParentClass(f);

            }
            return false;
        }

        // ---- typed properties ----

        static getPropertyClass(f:TypeClass<any>, propertyName:string):TypeClass<any> {
            while (f != <any>Object) {
                var classNameOfF = PersistenceAnnotation.getPropertyProperty(f, propertyName, "type")
                if (classNameOfF) {
                    var p = PersistenceAnnotation.getEntityClassByName(classNameOfF);
                    if (!p)
                        throw new Error('Class ' + f + "', property '" + propertyName + "': Defined as type '" + classNameOfF + "'. Could not find an entity with that name.");
                    else
                        return p;
                }
                f = PersistenceAnnotation.getParentClass(f);
            }
            return undefined
        }

        static getTypedPropertyNames<T extends Object>(f:TypeClass<T>):Array<string> {
            var result:Array<string> = [];
            while (f != <any>Object) {
                var props = getMetadata( "property_properties", f);
                for (var i in props) {
                    if( props[i].type )
                        result.push(i);
                }
                f = PersistenceAnnotation.getParentClass(f);
            }
            return result;
        }

        static setPropertyProperty(cls:TypeClass<any>, propertyName:string, property:string, value:any):void {
            var arr:any = getMetadata("property_properties", cls.constructor);
            if (!arr) {
                arr = {};
                defineMetadata("property_properties", arr, cls.constructor);
            }
            var propProps = arr[propertyName];

            if (!propProps) {
                propProps = {};
                arr[propertyName] = propProps;
            }
            propProps[property] = value;
        }

        private static getPropertyNamesOfPropertiesThatHaveProperties(cls:TypeClass<any>):Array<string>{
            return Object.keys( getMetadata("property_properties", cls) );
        }

        // this is i.e. good to find all properties on a class that have a "type" property
        private static getPropertyNamesOfPropertiesThatHaveAProperty(cls:TypeClass<any>, propertyPropertyName:string ):Array<string>{
            var r = [];
            var props  = getMetadata("property_properties", cls);
            for( var i in props ){
                if( props[i][propertyPropertyName] ){
                    r.push(i);
                }
            }
            return r;
        }

        private static getPropertyProperty(cls:TypeClass<any>, propertyName:string, propertyProperty:string):any {
            var arr:any = getMetadata("property_properties", cls);
            if (arr && arr[propertyName]) {
                return arr[propertyName][propertyProperty];
            }
            return undefined;
        }

        static getParentClass(t:TypeClass<any>):TypeClass<any> {
            return Object.getPrototypeOf(t.prototype).constructor;
        }


        static getIdPropertyName(t:TypeClass<any>):string {
            return PersistenceAnnotation.getObjectPropertyName(t, "_id") || "_id";
        }


        // ---- AsForeignKeys ----

        // static isStoredAsForeignKeys(f:TypeClass<any>, propertyName:string):boolean {
        //     while (f != Object) {
        //         if (PersistenceAnnotation.getPropertyProperty(f, propertyName, "askeys"))
        //             return true;
        //         f = PersistenceAnnotation.getParentClass(f);
        //
        //     }
        //     return false;
        // }

        static isIgnored(f:TypeClass<any>, propertyName:string):boolean {
            //return PersistenceAnnotation.getPropertyProperty(typeClass, propertyName, "ignore");
            while (f != Object) {
                if (PersistenceAnnotation.getPropertyProperty(f, propertyName, "ignore"))
                    return true;
                f = PersistenceAnnotation.getParentClass(f);

            }
            return false;
        }

        public static isParent(f:TypeClass<any>, propertyName:string):boolean {
            //return PersistenceAnnotation.getPropertyProperty(typeClass, propertyName, "ignore");
            while (f != Object) {
                if (PersistenceAnnotation.getPropertyProperty(f, propertyName, "parent"))
                    return true;
                f = PersistenceAnnotation.getParentClass(f);
            }
            return false;
        }

        static getParentPropertyNames<T extends Object>(f:TypeClass<T>):Array<string> {
            var result:Array<string> = [];
            while (f != <any>Object) {
                var props = getMetadata("parent_property", f);
                for (var i in props) {
                    if (PersistenceAnnotation.isParent(f, i))
                        result.push(i);
                }
                f = PersistenceAnnotation.getParentClass(f);
            }
            return result;
        }


        // ---- Wrap ----

        public static getWrappedFunctionNames<T extends Object>(f:TypeClass<T>):Array<string> {
            return PersistenceAnnotation.getPropertyNamesByMetaData(f.prototype, "persistence:wrap");
        }


        private static getCollectionUpdateOptions(cls:TypeClass<any>, functionName:string):any {
            return PersistenceAnnotation.getPropertyProperty(cls.prototype, functionName, "collectionUpdate");
        }


        public static getCollectionUpdateFunctionNames<T extends Object>(f:TypeClass<T>):Array<string> {
            return PersistenceAnnotation.getPropertyNamesOfPropertiesThatHaveAProperty( f, 'collectionUpdate' );
        }

        static getPropertyNamesByMetaData(o:any, metaData:string) {
            var result:Array<string> = [];
            for (var i in o) {
                var value = o[i];
                //console.log("Cave man style debugging 1",i, value,getMetadata("persistence:wrap", value) );
                if (typeof value == "function" && getMetadata(metaData, value))
                    result.push(i);
            }
            return result;
        }
    }


(function(){
    var data;
    if( typeof global!="undefined" ){
        if(!global["_omm_data"])
            global["_omm_data"] = {};
        data = global["_omm_data"];
    } else if( typeof window !="undefined" ){
        if(!window["_omm_data"])
            window["_omm_data"] = {};
        data = window["_omm_data"];
    } else
        data = {};
    if(!data.entityClasses)
        data.entityClasses = {};
    entityClasses = data.entityClasses;
    
    if(!data.registeredObjects)
        data.registeredObjects = {};
    registeredObjects = data.registeredObjects;
    if(!data.meteorMethodFunctions)
        data.meteorMethodFunctions = [];
    meteorMethodFunctions = data.meteorMethodFunctions;
    if(!data.eventListeners)
        data.eventListeners = {};
    eventListeners = data.eventListeners;

})();

