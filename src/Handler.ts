/**
 * Created by bert on 07.07.16.
 */

import {Object as ReobObject, Request, TypeClass} from "./reob"

/**
 * @hidden
 */
export interface Handler{
    collectionUpdate?(entityClass:TypeClass<any>, functionName:string, object:Object, originalFunction:Function, args:any[], request:Request ):any;
    webMethod?(entityClass:TypeClass<any>, functionName:string, object:Object, originalFunction:Function, args:any[], request:Request ):any;
}