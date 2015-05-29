
module omm {
    // TODO rename to "Path" or "SerializerPath". This has nothing to do with persistence.
    export class SerializationPath {
        private path:string;
        private objectRetriever:omm.ObjectRetriever;

        constructor(objectRetriever:omm.ObjectRetriever, className:string, id?:string) {
            this.path = className;
            this.objectRetriever = objectRetriever;
            if (id) this.path += "[" + id + "]";
            if (!this.getId())
                throw new Error("id is undefined");
        }

        clone():SerializationPath {
            return new SerializationPath(this.objectRetriever,this.path);
        }

        getCollectionName():string {
            return this.path.split("[")[0];
        }

        getObjectRetriever():omm.ObjectRetriever {
            return this.objectRetriever;
        }

        getId():string {
            return this.path.split("[")[1].split("]")[0];
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
                                if ((<any>arrayEntry).getId() == id) {
                                    o = arrayEntry;
                                    foundEntry = true;
                                    break;
                                }
                            }
                            if (!foundEntry)
                                o = undefined;
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

    }

}