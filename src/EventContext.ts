/**
 * Created by bert on 23.09.16.
 */

import * as reob from "./reob"

export class EventContext<T> {
    private cancelledError:any = false;

    beforeUpdate:T;
    beforeUpdateDocument:reob.Document;
    afterUpdateDocument:reob.Document;
    request:reob.Request;

    rootObject:T;
    rootObjectId:string;
    subObject:reob.Object;

    functionName:string;
    arguments:any[];

    constructor(rootObject?:T, subObject?:reob.Object ) {
        this.rootObject = rootObject;
        this.subObject = subObject;
        if( rootObject )
            this.rootObjectId = reob.getId(rootObject);
    }

    cancel(err:Error):void {
        this.cancelledError = err;
    }

    cancelledWithError():any {
        return this.cancelledError;
    }

}