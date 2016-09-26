
import * as omm_annotations from "./Annotations"

export default class SubObjectPath {
    private path:string;

    constructor(s?:string) {
        this.path= s || "";
    }

    clone():SubObjectPath {
        return new SubObjectPath(this.path);
    }

    forEachPathEntry( iterator:(propertyName:string, index:string|number)=>void ){
        if (this.path.length>0)
            this.path.split(".").forEach(function(entry:string){
                var propertyName = entry;
                var id = undefined;
                if (entry.indexOf("|") != -1) {
                    propertyName =  entry.split("|")[0];
                    id =  entry.split("|")[1];
                }
                iterator(propertyName, id);
            });
    }

    getSubObject(rootObject:Object):Object {
        var o:any = rootObject;
        this.forEachPathEntry(function(propertyName:string, id:string|number){
            if( typeof o != "undefined" ){
                o = o[propertyName];
                if( typeof o != "undefined" && typeof id!="undefined" ){
                    var foundEntry:boolean = false;
                    for (var j in o) {
                        var arrayEntry:Object = o[j];
                        if (omm_annotations.getId(<any>arrayEntry) === id) {
                            o = arrayEntry;
                            foundEntry = true;
                            break;
                        }
                    }
                    if (!foundEntry){
                        o = o[id];
                    }
                }
            }
        });
        return o;
    }

    appendArrayOrMapLookup(name:string, id:string):void {
        if( this.path.length>0 )
            this.path += ".";
        this.path += name + "|" + id;
    }

    appendPropertyLookup(name:string):void {
        if( this.path.length>0 )
            this.path += ".";
        this.path += name;
    }

    toString() {
        return this.path;
    }
}