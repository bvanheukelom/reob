///<reference path="../annotations/PersistenceAnnotation.ts"/>
///<reference path="../annotations/TypeClass.ts"/>
///<reference path="./Document.ts"/>
///<reference path="./Serializer.ts"/>
///<reference path="./ObjectRetriever.ts"/>
///<reference path="./Persistable.ts"/>

module omm{
    export class LocalObjectRetriever implements omm.ObjectRetriever{
        constructor(){
        }

        private setQuietProperty( obj:Object, propertyName:string, value:any ){
            if (!Object.getOwnPropertyDescriptor(obj, propertyName)) {
                Object.defineProperty(obj, propertyName, {
                    configurable: false,
                    enumerable: false,
                    writable: true
                });
            }
            obj[propertyName] = value;
        }

        getId(o: Object): string{
            var p = o["localPath"];
            return p;
        }

        getObject(s: string, parentObject?:Object, propertyName?:string ): Object{
            var subObjectPath= new SubObjectPath(s);
            return subObjectPath.getSubObject( parentObject["rootObject"] );
        }

        preToDocument(o:Object){
            var that = this;
            omm.Serializer.forEachTypedObject(o, function(path:omm.SubObjectPath, subO:omm.Persistable){
                that.setQuietProperty(subO,"localPath",path.toString());
            });
        }

        postToObject(o:Object){
            var that = this;
            omm.Serializer.forEachTypedObject(o, function(path:omm.SubObjectPath, o:omm.Persistable){
                that.setQuietProperty(o,"rootObject",o);
            });
        }

    }
}