
/// <reference path="./TypeClass.ts"/>
/// <reference path="../../../../typings/node/node.d.ts"/>

interface IMethodOptions{
    isStatic?:boolean;
    object?:string|Object;
    name?:string;
    parameterTypes?:Array<string>;
    resultType?:string;
    parentObject?:Object; // which has the function as a property
    functionName?:string;
    replaceWithCall?:boolean;
    serverOnly?:boolean;
}
/**
 * The omm module
 * @namespace omm
 */
module omm {
    export var entityClasses:{[index:string]:omm.TypeClass<Object>};
    export var registeredObjects:{[index:string]:any};
    export var meteorMethodFunctions:{[index:string]:Object};

    export function setNonEnumerableProperty( obj:Object, propertyName:string, value:any ):void{
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
    export function defineMetadata( propertyName, value, cls ){
        if( !cls.hasOwnProperty("_ommAnnotations") ){
            omm.setNonEnumerableProperty( cls, "_ommAnnotations", {});
        }
        var _ommAnnotations = cls._ommAnnotations;
        _ommAnnotations[propertyName] = value;
    }

    export function getMetadata( propertyName, cls ){
        if( cls.hasOwnProperty("_ommAnnotations") )
            return cls["_ommAnnotations"][propertyName];
        else {
            return undefined;
        }
    }

    export function Entity( p1:Function ):any {
        var typeClass:TypeClass<Object> = <TypeClass<Object>>p1;
        defineMetadata("persistence:entity", true, typeClass);
        omm.entityClasses[className(typeClass)]=typeClass;
    }

    /**
     * Declares a class as an entity.
     * @param c {function} The constructor function of the entity class.
     * @memberof omm
     */
    export function addEntity( c:TypeClass<Object>){
        omm.Entity(c);
    }

    export function getDefaultCollectionName(t:omm.TypeClass<any>):string{
        return omm.className(t);
    }

    export function addCollectionRoot( t:omm.TypeClass<any>, collectionName:string ){
        defineMetadata("persistence:collectionName", collectionName, t);
    }

    export function Wrap( t:Function, functionName:string, objectDescriptor:any ) {
        //omm.CollectionUpdate(t,functionName,objectDescriptor);
        //omm.MeteorMethod(t,functionName,objectDescriptor);
        //defineMetadata("persistence:wrap", true, (<any>t)[functionName] );
        omm.CollectionUpdate(t,functionName);
        omm.MeteorMethod({replaceWithCall:true})(t,functionName,objectDescriptor);
    }

    export function CollectionUpdate( p1:any, fName?:string )
    {
        var options = {};
        if( fName ){
            PersistenceAnnotation.setPropertyProperty(p1, fName, "collectionUpdate", options);
        }
        else{
            return function (t:Function, functionName:string, objectDescriptor:any) {
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
    export function collectionUpdate(c:omm.TypeClass<any>, functionName:string, options?:any ){
        if(!options){
            omm.CollectionUpdate(c, functionName);
        } else {
            (<any>omm.CollectionUpdate(options))(c, functionName);
        }
    }


    export function ArrayOrMap( typeClassName:string )
    {
        return function (targetPrototypeObject: any, propertyName:string) {
            //console.log("  "+propertyName+" as collection of "+typeClassName);
            PersistenceAnnotation.setPropertyProperty( targetPrototypeObject.constructor, propertyName, "type", typeClassName);
            PersistenceAnnotation.setPropertyProperty( targetPrototypeObject.constructor, propertyName, "arrayOrMap", true);
        };
    }


    export function ArrayType( typeClassName:string ) {
        return omm.ArrayOrMap(typeClassName);
    }

    /**
     * Declares the type of the values in the array. This is synonymous to {@link omm.dictionaryType}.
     * @param c {function} The constructor function of the entity class.
     * @param propertyName {string} The name of the array property.
     * @param typeClassName {string} The classname of the entity that the array contains.
     * @memberof omm
     */
    export function arrayType( c:TypeClass<Object>, propertyName:string, typeClassName:string ) {
        omm.ArrayOrMap(typeClassName)(c.prototype, propertyName);
    }

    export function DictionaryType( typeClassName:string ) {
        return omm.ArrayOrMap(typeClassName);
    }

    /**
     * Declares the type of the values in the dictionary. This is synonymous to {@link omm.arrayType}.
     * @param c {function} The constructor function of the entity class.
     * @param propertyName {string} The name of the array property.
     * @param typeClassName {string} The classname of the entity that the array contains.
     * @memberof omm
     */
    export function dictionaryType( typeClassName:string ) {
        return omm.ArrayOrMap(typeClassName);
    }

    export function AsForeignKeys( targetPrototypeObject:any, propertyName:string  )
    {
        return PersistenceAnnotation.setPropertyProperty(targetPrototypeObject.constructor, propertyName, "askeys", true);
    }

    export function Id( targetPrototypeObject:any, propertyName:string  ) {
        omm.DocumentName("_id")(targetPrototypeObject, propertyName);
    }

    export function Parent( targetPrototypeObject:any, propertyName:string  ) {
        PersistenceAnnotation.setPropertyProperty(targetPrototypeObject.constructor, propertyName, "parent", 1);
    }

    /**
     * Used to declare which property is used as the value for "_id".
     * @param c {function} The constructor function of the entity class.
     * @param propertyName {string} The name of the id property.
     * @memberof omm
     */
    export function idProperty(c:TypeClass<Object>, propertyName:string){
        omm.Id(c.prototype, propertyName);
    }

    export function Ignore( targetPrototypeObject:any, propertyName:string  ){
        PersistenceAnnotation.setPropertyProperty(targetPrototypeObject.constructor, propertyName, "ignore", true);
    }

    /**
     * Declares that a property of an entity is not persisted.
     * @param c {function} The constructor function of the entity class.
     * @param propertyName {string} The name of the id property.
     * @memberof omm
     */
    export function ignoreProperty(c:TypeClass<Object>, propertyName:string){
        omm.Ignore(c.prototype, propertyName);
    }


    export function DocumentName( name:string ) {
        return function(targetPrototypeObject:any, propertyName:string ) {
            var objNames:any = getMetadata("objectNames", targetPrototypeObject);
            if( !objNames ) {
                objNames = {};
                defineMetadata("objectNames", objNames, targetPrototypeObject );
            }
            var documentNames:any = getMetadata("documentNames", targetPrototypeObject);
            if( !documentNames ) {
                documentNames = {};
                defineMetadata("documentNames", documentNames, targetPrototypeObject );
            }
            objNames[name] = propertyName;
            documentNames[propertyName] = name;
        }
    }


    // for grammar reasons
    export function AsForeignKey( targetPrototypeObject:Function, propertyName:string  )
    {
        return AsForeignKeys(targetPrototypeObject, propertyName );
    }

    export function Type(typeClassName:string) {
        return function (targetPrototypeObject: any, propertyName:string) {
            //console.log("  "+propertyName+" as "+typeClassName);
            PersistenceAnnotation.setPropertyProperty( targetPrototypeObject.constructor, propertyName, "type", typeClassName);
        };
    }

    export function type( t:TypeClass<Object>, propertyName:string, className:string){
        omm.Type(className)(t.prototype, propertyName);
    }

    // plain js api
    export function propertyType( t:TypeClass<Object>, propertyName:string, typeClassName:string ){
        omm.Type(typeClassName)(t.prototype, propertyName);
    }
    export function propertyArrayType( t:TypeClass<Object>, propertyName:string, typeClassName:string ){
        omm.ArrayType(typeClassName)(t.prototype, propertyName);
    }
    export function propertyDictionaryType( t:TypeClass<Object>, propertyName:string, typeClassName:string ){
        omm.DictionaryType(typeClassName)(t.prototype, propertyName);
    }

    /**
     * Declares that a property that stores an Entity is to be stored as a string which references the entity rather than
     * the whole entity. Use this to break up circular references.
     *
     * @param c {function} The constructor function of the class.
     * @param propertyName {string} The name of the property that should be stored as a string.
     * @memberof omm
     */
    export function asForeignKey( c:TypeClass<Object>, propertyName:string ){
        omm.AsForeignKey(c.prototype, propertyName);
    }

    /**
     * Returns the property previously defined with {@link omm.idProperty} or the _id property.
     * @param o {Object} the object
     * @returns {any}
     * @memberof omm
     */
    export function getId( o:Object ){
        var idPropertyName = omm.PersistenceAnnotation.getIdPropertyName(omm.PersistenceAnnotation.getClass(o));
        if(!idPropertyName)
            throw new Error( "No id property defined for object of class "+omm.PersistenceAnnotation.getClass(o) );
        else
            return o[idPropertyName];
    }


    export function className(fun:omm.TypeClass<Object>):string
    {
        var ret = fun.toString();
        ret = ret.substr('function '.length);
        ret = ret.substr(0, ret.indexOf('('));
        return ret;
    }

    export function MeteorMethod( p1:any, p2?:any ) {
        if( typeof p1=="object" && typeof p2=="string" ){
            var options:IMethodOptions = { isStatic:false };
            options.parentObject = p1;
            options.functionName = p2;
            if( !options.name )
                options.name = p2;
            omm.meteorMethodFunctions[options.name] = options;
        } else {
            return function (t:Function, functionName:string, objectDescriptor:any) {
                var options:IMethodOptions = {};
                if( typeof p1=="object" )
                    options = p1;
                else if( typeof p1=="string" ) {
                    if (typeof p2 == "object")
                        options = p2;
                    options.name = p1;
                }
                options.functionName = functionName;
                options.isStatic = false;
                options.parentObject = t;
                if( !options.name ){
                    options.name = functionName;
                }

                omm.meteorMethodFunctions[options.name] = options;
            };
        }
    }


    export function StaticMeteorMethod( p1:any, p2?:any ) {
        if( typeof p1=="function" && typeof p2=="string"  ){
            var options:IMethodOptions = { isStatic:true };
            options.parentObject = p1;
            options.functionName = p2;
            options.object = p1;
            if( !options.name )
                options.name = p2;
            omm.meteorMethodFunctions[options.name] = options;
        } else {
            return function (t:Function, functionName:string, objectDescriptor:any) {
                var options:IMethodOptions = {};
                if( typeof p1=="object" )
                    options = p1;
                else if( typeof p1=="string" ) {
                    if (typeof p2 == "object")
                        options = p2;
                    options.name = p1;
                }
                options.parentObject = t;
                options.functionName = functionName;
                options.isStatic = true;
                options.object = t;
                if( !options.name )
                    options.name = functionName;

                omm.meteorMethodFunctions[options.name] = options;
            };
        }
    }

    export class PersistenceAnnotation
    {
        public static getMethodOptions( functionName:string ):IMethodOptions{
            return omm.meteorMethodFunctions[functionName];
        }

        public static getMethodFunctionNames<T extends Object>(c:any):Array<string> {
            var ret = [];
            for( var i in omm.meteorMethodFunctions ){
                var methodOptions:IMethodOptions = omm.meteorMethodFunctions[i];
                if( methodOptions.parentObject==c )
                    ret.push( i );
            }
            return ret;
        }

        public static getMethodFunctionNamesByObject<T extends Object>(o:any):Array<string> {
            var ret = [];
            for( var i in omm.meteorMethodFunctions ){
                var methodOptions:IMethodOptions = omm.meteorMethodFunctions[i];
                if( methodOptions.object==o )
                    ret.push( i );
            }
            return ret;
        }

        public static getAllMethodFunctionNames():Array<string> {
            var ret = [];
            for( var i in omm.meteorMethodFunctions ){
                ret.push( i );
            }
            return ret;
        }

        static getClass<T extends Object>( o:T ):omm.TypeClass<T>
        {
            if( o )
                return <TypeClass<T>>o.constructor;
            else
                return undefined;
        }

    // ---- Entity ----

        static getEntityClassByName( className:string ):omm.TypeClass<any>
        {
            return omm.entityClasses[className];
        }

        public static getCollectionClasses():Array<omm.TypeClass<Object>>
        {
            var result:Array<omm.TypeClass<Object>> = [];
            for( var i in omm.entityClasses )
            {
                var entityClass = omm.entityClasses[i];
                if( PersistenceAnnotation.getCollectionName(entityClass) )
                    result.push(entityClass);
            }
            return result;
        }

        public static getEntityClasses():Array<TypeClass<Object>>
        {
            var result:Array<TypeClass<Object>> = [];
            for( var i in omm.entityClasses )
            {
                var entityClass = omm.entityClasses[i];
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
            return !!omm.entityClasses[className(f)];
        }

        static getDocumentPropertyName( typeClass:TypeClass<any>,  objectPropertyName:string ):string {
            var documentNames = getMetadata("documentNames", typeClass.prototype);
            return documentNames?documentNames[objectPropertyName]:undefined;
        }

        static getObjectPropertyName( typeClass:TypeClass<any>,  documentPropertyName:string ):string {
            var objectNames = getMetadata("objectNames", typeClass.prototype);
            return objectNames?objectNames[documentPropertyName]:undefined;
        }

        static isArrayOrMap( f:TypeClass<any>, propertyName:string ):boolean{
            while(f!=Object){
                if( PersistenceAnnotation.getPropertyProperty(f, propertyName, "arrayOrMap") )
                    return true;
                f = omm.PersistenceAnnotation.getParentClass(f);

            }
            return false;
        }

        // ---- typed properties ----

        static getPropertyClass(f:TypeClass<any>, propertyName:string):TypeClass<any> {
            while (f != <any>Object){
                var className = PersistenceAnnotation.getPropertyProperty(f, propertyName, "type")
                if (className)
                    return PersistenceAnnotation.getEntityClassByName(className);
                f = omm.PersistenceAnnotation.getParentClass(f);
            }
            return undefined
        }

        static getTypedPropertyNames<T extends Object>(f:TypeClass<T>):Array<string> {
            var result:Array<string> = [];
            while( f!=<any>Object ) {
                var props = getMetadata("persistence:typedproperties", f);
                for (var i in props) {
                    if (PersistenceAnnotation.getPropertyClass(f, i))
                        result.push(i);
                }
                f = omm.PersistenceAnnotation.getParentClass(f);
            }
            return result;
        }

        static setPropertyProperty( cls:TypeClass<any>, propertyName:string, property:string, value:any  ):void {
            var arr:any = getMetadata("persistence:typedproperties", cls);
            if( !arr ) {
                arr = {};
                defineMetadata("persistence:typedproperties", arr, cls );
            }
            var propProps = arr[propertyName];

            if( !propProps ) {
                propProps = {};
                arr[propertyName] = propProps;
            }
            propProps[property] = value;
        }

        private static getPropertyProperty( cls:TypeClass<any>, propertyName:string, propertyProperty:string ):any {
            var arr:any = getMetadata("persistence:typedproperties", cls);
            if( arr && arr[propertyName] ) {
                return arr[propertyName][propertyProperty];
            }
            return undefined;
        }

        static getParentClass( t:TypeClass<any> ):TypeClass<any> {
            return Object.getPrototypeOf(t.prototype).constructor;
        }


        static getIdPropertyName(t:TypeClass<any>):string{
            return  omm.PersistenceAnnotation.getObjectPropertyName( t, "_id" ) || "_id";
        }


        // ---- AsForeignKeys ----

        static isStoredAsForeignKeys( f:TypeClass<any>, propertyName:string ):boolean {
            while(f!=Object){
                if( PersistenceAnnotation.getPropertyProperty(f, propertyName, "askeys") )
                    return true;
                f = omm.PersistenceAnnotation.getParentClass(f);

            }
            return false;
        }

        static isIgnored( f:TypeClass<any>, propertyName:string ):boolean
        {
            //return PersistenceAnnotation.getPropertyProperty(typeClass, propertyName, "ignore");
            while(f!=Object){
                if( PersistenceAnnotation.getPropertyProperty(f, propertyName, "ignore") )
                    return true;
                f = omm.PersistenceAnnotation.getParentClass(f);

            }
            return false;
        }
        static isParent( f:TypeClass<any>, propertyName:string ):boolean
        {
            //return PersistenceAnnotation.getPropertyProperty(typeClass, propertyName, "ignore");
            while(f!=Object){
                if( PersistenceAnnotation.getPropertyProperty(f, propertyName, "parent") )
                    return true;
                f = omm.PersistenceAnnotation.getParentClass(f);
            }
            return false;
        }
        static getParentPropertyNames<T extends Object>(f:TypeClass<T>):Array<string> {
            var result:Array<string> = [];
            while( f!=<any>Object ) {
                var props = getMetadata("persistence:typedproperties", f);
                for (var i in props) {
                    if (PersistenceAnnotation.isParent(f, i))
                        result.push(i);
                }
                f = omm.PersistenceAnnotation.getParentClass(f);
            }
            return result;
        }


        // ---- Wrap ----

        public static getWrappedFunctionNames<T extends Object>(f:TypeClass<T>):Array<string> {
            return PersistenceAnnotation.getPropertyNamesByMetaData(f.prototype, "persistence:wrap");
        }


        private static getCollectionUpdateOptions( cls:TypeClass<any>, functionName:string ):any{
            return PersistenceAnnotation.getPropertyProperty(cls.prototype, functionName, "collectionUpdate");
        }



        public static getCollectionUpdateFunctionNames<T extends Object>(f:TypeClass<T>):Array<string> {
            var result:Array<string> = [];
            var props = getMetadata("persistence:typedproperties", f.prototype);
            for (var i in props) {
                if (PersistenceAnnotation.getCollectionUpdateOptions(f, i))
                    result.push(i);
            }
            return result;
        }

        static getPropertyNamesByMetaData( o:any, metaData:string ) {
            var result:Array<string> = [];
            for( var i in o ) {
                var value = o[i];
                //console.log("Cave man style debugging 1",i, value,getMetadata("persistence:wrap", value) );
                if( typeof value =="function" && getMetadata(metaData, value) )
                    result.push(i);
            }
            return result;
        }
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
    omm.entityClasses = data.entityClasses;
    if(!data.registeredObjects)
        data.registeredObjects = {};
    omm.registeredObjects = data.registeredObjects;
    if(!data.meteorMethodFunctions)
        data.meteorMethodFunctions = {};
    omm.meteorMethodFunctions = data.meteorMethodFunctions;

})();

