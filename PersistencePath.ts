///<reference path="references.d.ts"/>
module persistence {
    export class PersistencePath {
        private path:string;

        constructor(className:string, id?:string) {
            this.path = className;
            if (id) this.path += "[" + id + "]";
            if (!this.getId())
                throw new Error("id is undefined");
        }

        clone():PersistencePath {
            return new PersistencePath(this.path);
        }

        getClassName():string {
            return this.path.split("[")[0];
        }

        getId():string {
            return this.path.split("[")[1].split("]")[0];
        }


        getSubObject(rootObject:Persistable):Persistable {
            var o:any = rootObject;
            if (this.path.indexOf(".") != -1) {
                this.path.split("].")[1].split(".").forEach(function (entry:string) {
                    if (o instanceof Array) {
                        for (var j in o) {
                            var arrayEntry:Persistable = o[j];
                            if (arrayEntry.getId() == entry) {
                                o = arrayEntry;
                                break;
                            }
                        }
                    }
                    else if (o)
                        o = o[entry];
                });
            }
            return o;
        }

        appendArrayLookup(id:string):void {
            this.path += "." + id;
        }

        appendPropertyLookup(name:string):void {
            this.path += "." + name;
        }

        toString() {
            return this.path;
        }

    }

}