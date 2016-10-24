
import * as reob from "./reob"
import {setNonEnumerableProperty} from "./Internal"
export class SerializationPath {
    private path:string;

    // this is used when lazy loading properties
    // private objectRetriever:ObjectRetriever;

    constructor(collectionName:string, id?:string) {
        this.path = collectionName;
        // this.objectRetriever = objectRetriever;
        if (id) this.path += "[" + id + "]";
        if (!this.getId()){
            debugger;
            throw new Error("the id parameter is missing");
        }
    }

    clone():SerializationPath {
        var sp =  new SerializationPath(this.path);
        return sp;
    }

    getCollectionName():string {
        return this.path.split("[")[0];
    }

    getId():string {
        var i1 = this.path.indexOf("[");
        var i2 = this.path.indexOf("]");
        if(i1!=-1 && i2!=-1 && i1<i2)
            return this.path.split("[")[1].split("]")[0];
        else
            return undefined;
    }

    forEachPathEntry( iterator:(propertyName:string, index:string|number)=>void ){
        if (this.path.indexOf(".") != -1)
            this.path.split("].")[1].split(".").forEach(function(entry:string){
                var propertyName = entry;
                var index = undefined;
                if (entry.indexOf("|") != -1) {
                    propertyName =  entry.split("|")[0];
                    index =  entry.split("|")[1];
                }
                iterator(propertyName, index);
            });
    }

    getSubObject(rootObject:Object):Object {
        var o:any = rootObject;
        if (this.path.indexOf(".") != -1) {
            this.path.split("].")[1].split(".").forEach(function (entry:string) {
                if( o ) {
                    if (entry.indexOf("|") != -1) {
                        var p = entry.split("|");
                        var arrayOrMap = o[p[0]];
                        var id = p[1];
                        var foundEntry:boolean = false;
                        for (var j in arrayOrMap) {
                            var arrayEntry:Object = arrayOrMap[j];
                            if ((<any>arrayEntry).getId && (<any>arrayEntry).getId() == id) {
                                o = arrayEntry;
                                foundEntry = true;
                                break;
                            }
                        }
                        if (!foundEntry) {
                            if( arrayOrMap[id] )
                                o = arrayOrMap[id];
                            else
                                o = undefined;

                        }

                    }
                    else
                        o = o[entry];
                }
            });
        }
        return o;
    }

    appendArrayOrMapLookup(name:string, id:string):void {
        this.path += "." + name + "|" + id;
    }

    appendPropertyLookup(name:string):void {
        this.path += "." + name;
    }

    toString() {
        return this.path;
    }


    static setObjectContext(object:reob.Object, sp:SerializationPath, handler:reob.Handler, request:reob.Request ):void{
        if( object ){
            setNonEnumerableProperty( object, "_reobObjectContext", {
                serializationPath:sp,
                handler:handler,
                request:request
            } );
        }
    }

    static getObjectContext(object:reob.Object  ):reob.ObjectContext{
        return object? object._reobObjectContext:undefined;
    }

    // if I could I would make this package protected
    static updateObjectContexts(object:reob.Object, handler:reob.Handler, request:reob.Request, visited?:Array<Object>):void {
        var that = this;
        if (!visited)
            visited = [];
        if (visited.indexOf(object) != -1)
            return;
        if( !object || typeof object!="object" )
            return;

        visited.push(object);
        var objectClass = reob.Reflect.getClass(object);
        // // if (PersistenceAnnotation.PersistenceAnnotation.isRootEntity(objectClass)) {
        //     if (!object._ommObjectContext || !object._ommObjectContext.serializationPath) {
        //         var id = PersistenceAnnotation.getId(object);
        //         if ( id ){
        //             var sp = new SerializationPath( PersistenceAnnotation.PersistenceAnnotation.getCollectionName(objectClass), id);
        //             SerializationPath.setObjectContext( object, sp, handler );
        //         }
        //     }
        // // }
        if (!SerializationPath.getObjectContext( object )){
            // throw new Error("Cant update object context, as there is no object context. Class:"+PersistenceAnnotation.className(objectClass)+" Id:"+PersistenceAnnotation.getId(object));
            return; // we're done here
        }


        reob.Reflect.getTypedPropertyNames(objectClass).forEach(function (typedPropertyName:string) {
            // if (!PersistenceAnnotation.isStoredAsForeignKeys(objectClass, typedPropertyName)) {
            //     //console.log("updating foreignkey property " + typedPropertyName);
            var v:reob.Object = object[typedPropertyName];
            if (v) {
                if (reob.Reflect.isArrayOrMap(objectClass, typedPropertyName)) {
                    //console.log("updating foreignkey property " + typedPropertyName + " is array");
                    for (var i in v) {
                        var e = v[i];
                        if( e ) {
                            var index = i;
                            if (reob.getId(e))
                                index = reob.getId(e);
                            //console.log("updating persistnece path for isArrayOrMap " + typedPropertyName + "  key:" + i + " value:", e, "object: ", object);
                            var sp = SerializationPath.getObjectContext( object ).serializationPath.clone();
                            sp.appendArrayOrMapLookup(typedPropertyName, index);
                            SerializationPath.setObjectContext(e, sp, handler, request);
                            that.updateObjectContexts(e, handler, request, visited);
                        }
                    }
                }
                else {
                    //console.log("updating foreignkey property direct property " + typedPropertyName);
                    var sp = SerializationPath.getObjectContext( object ).serializationPath.clone();
                    sp.appendPropertyLookup(typedPropertyName);
                    SerializationPath.setObjectContext(v, sp, handler, request);
                }
            }

        });
    }

}
