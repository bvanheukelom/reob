/**
 * Created by bert on 07.07.16.
 */

import * as reob from "./reob"

export interface Handler{
    collectionUpdate?( entityClass:reob.TypeClass<any>, functionName:string, object:reob.OmmObject, originalFunction:Function, args:any[], session:reob.Session ):any;
    webMethod?( entityClass:reob.TypeClass<any>, functionName:string, object:reob.OmmObject, originalFunction:Function, args:any[], session:reob.Session ):any;
    
}