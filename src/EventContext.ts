/**
 * Created by bert on 23.09.16.
 */

import * as omm from "./omm"

export class EventContext<T> {
    private  cancelledError:any = false;
    preUpdate:T;
    preUpdateDocument:Document;
    postUpdateDocument:Document;
    object:T;
    userData:any;
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
            this.objectId = omm.getId(o);
        this.collection = coll;
    }

    cancel(err:Error):void {
        this.cancelledError = err;
    }

    cancelledWithError():any {
        return this.cancelledError;
    }

}