/**
 * Created by bert on 07.07.16.
 */

import * as reob from "./reob"

/**
 * @hidden
 */
export interface Handler{
    collectionUpdate?( entityClass:reob.TypeClass<any>, functionName:string, object:reob.OmmObject, originalFunction:Function, args:any[], request:reob.Request ):any;
    webMethod?( entityClass:reob.TypeClass<any>, functionName:string, object:reob.OmmObject, originalFunction:Function, args:any[], request:reob.Request ):any;
}