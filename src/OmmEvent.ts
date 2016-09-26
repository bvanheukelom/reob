/**
 * Created by bert on 06.03.16.
 */

import * as omm from "./omm"
import * as Promise from "bluebird"

export function on<O extends Object>( t:omm.TypeClass<O>, topic:string|omm.EventListener<any>,  f?:omm.EventListener<any> ):void {
    var className = omm.Reflect.getClassName(t);
    if( typeof topic == "function" ){
        f = <omm.EventListener<any>>topic;
        topic = null;
    }

    var e= omm.Reflect.getEntityClassByName(className);
    if( !e )
        throw new Error("Type is not an entity");

    if( !omm.eventListeners[className] ){
        omm.eventListeners[className] = {};
    }
    if( topic ) {
        if (!omm.eventListeners[className][<string>topic])
            omm.eventListeners[className][<string>topic] = [];
        omm.eventListeners[className][<string>topic].push(f);
    }else{
        if (!omm.eventListeners[className]["_all"])
            omm.eventListeners[className]["_all"] = [];
        omm.eventListeners[className]["_all"].push(f);
    }

}


export function removeAllUpdateEventListeners(){
    for( var i in omm.eventListeners )
        delete omm.eventListeners[i];
}

