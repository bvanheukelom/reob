///<reference path="references.d.ts"/>
module persistence
{
    export class PersistenceAnnotation
    {
        static className(fun:TypeClass<Persistable>):string
        {
            var ret = fun.toString();
            ret = ret.substr('function '.length);
            ret = ret.substr(0, ret.indexOf('('));
            return ret;
        }

        static getClass<T extends Object>( o:T ):TypeClass<T>
        {
            if( o )
                return <TypeClass<T>>o.constructor;
            else
                return undefined;
        }

    // ---- Entity ----

        static Entity( p1?:any ):any
        {
            if( typeof p1=="string")
            {
                return function (target:Function) {
                    var typeClass:TypeClass<Persistable> = <TypeClass<Persistable>>target;
                    console.log("Entity(<class>) "+PersistenceAnnotation.className(typeClass)+" with collection name:"+p1);
                    Reflect.defineMetadata("persistence:collectionName", p1, typeClass);
                    Reflect.defineMetadata("persistence:entity", true, typeClass);
                    PersistencePrivate.entityClasses[PersistenceAnnotation.className(typeClass)]=typeClass;
                }
            }
            if( typeof p1=="boolean" )
            {
                return function (target:Function) {
                    var typeClass:TypeClass<Persistable> = <TypeClass<Persistable>>target;
                    console.log("Entity(true) "+PersistenceAnnotation.className(typeClass)+" with collection name:", PersistenceAnnotation.className(typeClass));
                    if( p1 )
                        Reflect.defineMetadata("persistence:collectionName", PersistenceAnnotation.className(typeClass), typeClass);
                    Reflect.defineMetadata("persistence:entity", true, typeClass);
                    PersistencePrivate.entityClasses[PersistenceAnnotation.className(typeClass)]=typeClass;
                }
            }
            else if( typeof p1=="function" ) // annotated without braces
            {
                //var tc:TypeClass<Persistable> = <TypeClass<Persistable>>p1;
                //var className = PersistenceAnnotation.className(tc);
                //PersistencePrivate.collectionRootClasses.push(tc);
                var typeClass:TypeClass<Persistable> = <TypeClass<Persistable>>p1;

                console.log("Entity() "+PersistenceAnnotation.className(typeClass));
                //Reflect.defineMetadata("persistence:collectionName", PersistenceAnnotation.className(typeClass), typeClass);
                Reflect.defineMetadata("persistence:entity", true, typeClass);
                PersistencePrivate.entityClasses[PersistenceAnnotation.className(typeClass)]=typeClass;
            }
        }

        static getEntityClassByName( className:string ):TypeClass<any>
        {
            return PersistencePrivate.entityClasses[className];
        }

        public static getCollectionClasses():Array<TypeClass<Persistable>>
        {
            var result:Array<TypeClass<Persistable>> = [];
            for( var i in PersistencePrivate.entityClasses )
            {
                var entityClass = PersistencePrivate.entityClasses[i];
                if( PersistenceAnnotation.getCollectionName(entityClass) )
                    result.push(entityClass);
            }
            return result;
        }

        public static getEntityClasses():Array<TypeClass<Persistable>>
        {
            var result:Array<TypeClass<Persistable>> = [];
            for( var i in PersistencePrivate.entityClasses )
            {
                var entityClass = PersistencePrivate.entityClasses[i];
                result.push(entityClass);
            }
            return result;
        }

        static getCollectionName(f:TypeClass<any>):string {
            return Reflect.getMetadata("persistence:collectionName", f);
        }
        static isRootEntity(f:TypeClass<any>):boolean {
            return !!PersistenceAnnotation.getCollectionName(f);
        }

        // ---- Collection ----

        static ArrayOrMap( typeClassName:string )
        {
            return function (targetPrototypeObject: Function, propertyName:string) {
                console.log("  "+propertyName+" as collection of "+typeClassName);
                PersistenceAnnotation.setPropertyProperty( targetPrototypeObject, propertyName, "type", typeClassName);
                PersistenceAnnotation.setPropertyProperty( targetPrototypeObject, propertyName, "arrayOrMap", true);
            };
        }

        static isArrayOrMap( typeClass:Function, propertyName:string ):boolean
        {
            return PersistenceAnnotation.getPropertyProperty( typeClass.prototype, propertyName, "arrayOrMap")==true;
        }

    // ---- typed properties ----

        public static Type(typeClassName:string) {
            return function (targetPrototypeObject: Function, propertyName:string) {
                console.log("  "+propertyName+" as "+typeClassName);
                PersistenceAnnotation.setPropertyProperty( targetPrototypeObject, propertyName, "type", typeClassName);
            };
        }

        static getPropertyClass(f:Function, propertyName:string):TypeClass<Persistable> {
            var className = PersistenceAnnotation.getPropertyProperty( f.prototype, propertyName, "type")
            return PersistenceAnnotation.getEntityClassByName(className);
        }

        static getTypedPropertyNames<T extends Persistable>(f:TypeClass<T>):Array<string> {
            var result:Array<string> = [];
            var props = Reflect.getMetadata("persistence:typedproperties",f.prototype);
            for( var i in props )
            {
                if( PersistenceAnnotation.getPropertyClass(f, i) )
                    result.push(i);
            }
            return result;
        }

        private static setPropertyProperty( targetPrototypeObject:Function, propertyName:string, property:string, value:any  ):void {
            var arr:any = Reflect.getMetadata("persistence:typedproperties", targetPrototypeObject);
            if( !arr ) {
                arr = {};
                Reflect.defineMetadata("persistence:typedproperties", arr, targetPrototypeObject );
            }
            var propProps = arr[propertyName];

            if( !propProps )
            {
                propProps = {};
                arr[propertyName] = propProps;
            }
            propProps[property] = value;
        }

        private static getPropertyProperty( targetPrototypeObject:Function, propertyName:string, propertyProperty:string ):any
        {
            var arr:any = Reflect.getMetadata("persistence:typedproperties", targetPrototypeObject);
            if( arr && arr[propertyName] )
            {
                return arr[propertyName][propertyProperty];
            }
            return undefined;
        }
        // ---- AsForeignKeys ----

        static isStoredAsForeignKeys( typeClass:Function, propertyName:string ):boolean
        {
            return PersistenceAnnotation.getPropertyProperty(typeClass.prototype, propertyName, "askeys");
        }

        static AsForeignKeys( targetPrototypeObject:Function, propertyName:string  )
        {
            return PersistenceAnnotation.setPropertyProperty(targetPrototypeObject, propertyName, "askeys", true);
        }

        // for grammar reasons
        static AsForeignKey( targetPrototypeObject:Function, propertyName:string  )
        {
            return PersistenceAnnotation.AsForeignKeys(targetPrototypeObject, propertyName );
        }

        // ---- Wrap ----

        public static getWrappedFunctionNames<T extends Persistable>(f:TypeClass<T>):Array<string>
        {
            return PersistenceAnnotation.getPropertyNamesByMetaData(f.prototype, "persistence:wrap");
        }

        private static getPropertyNamesByMetaData( o:any, metaData:string )
        {
            var result:Array<string> = [];
            for( var i in o )
            {
                var value = o[i];
                //console.log("Cave man style debugging 1",i, value,Reflect.getMetadata("persistence:wrap", value) );
                if( typeof value =="function" && Reflect.getMetadata(metaData, value) )
                    result.push(i);
            }
            return result;
        }

        static Wrap( t:Function, functionName:string, objectDescriptor:any )
        {
            Reflect.defineMetadata("persistence:wrap", true, (<any>t)[functionName] );
        }

    }
    class PersistencePrivate
    {
        static entityClasses:{[index:string]:TypeClass<Persistable>} = {};
    }
}
