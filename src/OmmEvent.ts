/**
 * Created by bert on 06.03.16.
 */

import * as reob from "./reob"
import * as Promise from "bluebird"
/**
 * @deprecated
 */
export function on<O extends Object>( t:reob.TypeClass<O>, topic:string|reob.EventListener<any>,  f?:reob.EventListener<any> ):void {
    var className = reob.Reflect.getClassName(t);
    if( typeof topic == "function" ){
        f = <reob.EventListener<any>>topic;
        topic = null;
    }

    var e= reob.Reflect.getEntityClassByName(className);
    if( !e )
        throw new Error("Type is not an entity");

    if( !reob.eventListeners[className] ){
        reob.eventListeners[className] = {};
    }
    if( topic ) {
        if (!reob.eventListeners[className][<string>topic])
            reob.eventListeners[className][<string>topic] = [];
        reob.eventListeners[className][<string>topic].push(f);
    }else{
        if (!reob.eventListeners[className]["_all"])
            reob.eventListeners[className]["_all"] = [];
        reob.eventListeners[className]["_all"].push(f);
    }

}


export function removeAllUpdateEventListeners(){
    for( var i in reob.eventListeners )
        delete reob.eventListeners[i];
}

