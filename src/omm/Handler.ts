/**
 * Created by bert on 07.07.16.
 */

import * as omm from "../omm"

export interface Handler{
    collectionUpdate?(entityClass:omm.TypeClass<any>, functionName:string, object:omm.OmmObject, originalFunction:Function, args:any[] ):any;
    webMethod?(entityClass:omm.TypeClass<any>, functionName:string, object:omm.OmmObject, originalFunction:Function, args:any[] ):any;
}