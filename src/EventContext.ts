/**
 * Created by bert on 23.09.16.
 */

import * as reob from "./reob"

export class EventContext<T> {
    private  cancelledError:any = false;
    preUpdate:T;
    preUpdateDocument:reob.Document;
    postUpdateDocument:reob.Document;
    object:T;
    request:reob.Request;
    objectId:string;
    collection:any; //omm.Collection<T>;
    rootObject:any;
    functionName:string;
    serializationPath:any; //omm.SerializationPath;
    topic:string;
    arguments:any[];

    constructor(o:T, coll:any /*omm.Collection<T>*/) {
        this.object = o;
        if( o )
            this.objectId = reob.getId(o);
        this.collection = coll;
    }

    cancel(err:Error):void {
        this.cancelledError = err;
    }

    cancelledWithError():any {
        return this.cancelledError;
    }

}