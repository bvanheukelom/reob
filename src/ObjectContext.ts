/**
 * Created by bert on 07.07.16.
 */
import * as reob from "./reob"

export interface ObjectContext{
    serializationPath:reob.SerializationPath;
    handler:reob.Handler;
    request:reob.Request;
}