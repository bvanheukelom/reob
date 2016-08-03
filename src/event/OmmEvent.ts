/**
 * Created by bert on 06.03.16.
 */

import * as omm from "../annotations/PersistenceAnnotation"
import * as Promise from "bluebird"

export function on<O extends Object>( t:omm.TypeClass<O>, topic:string|omm.EventListener<any>,  f?:omm.EventListener<any> ):void {
    var className = omm.className(t);
    if( typeof topic == "function" ){
        f = <omm.EventListener<any>>topic;
        topic = null;
    }

    var e= omm.PersistenceAnnotation.getEntityClassByName(className);
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

// export function onUpdate<O extends Object>(  t:omm.TypeClass<O>, functionName?:string|omm.EventListener, f?:omm.EventListener ):void {
//     var className = omm.className(t);
//     if( typeof functionName == "function" ){
//         f = <omm.EventListener>functionName;
//         functionName = null;
//     }
//
//     var e= omm.PersistenceAnnotation.getEntityClassByName(className);
//     if( !e )
//         throw new Error("Type is not an entity");
//     if( functionName && omm.PersistenceAnnotation.getCollectionUpdateFunctionNames(t).indexOf(<string>functionName)==-1 )
//         throw new Error("Function '"+functionName+"' is not a collection update function");
//
//     if( !omm.eventListeners[className] ){
//         omm.eventListeners[className] = {};
//     }
//     var topic = "post"+(functionName?":"+functionName:"");
//     if( !omm.eventListeners[className][topic] )
//         omm.eventListeners[className][topic] = [];
//     omm.eventListeners[className][topic].push(f);
// }
//
// export function preUpdate<O extends Object>(  t:omm.TypeClass<O>, functionName?:string|omm.EventListener, f?:omm.EventListener ):void {
//     var className = omm.className(t);
//     if( typeof functionName == "function" ){
//         f = <omm.EventListener>functionName;
//         functionName = null;
//     }
//
//     var e= omm.PersistenceAnnotation.getEntityClassByName(className);
//     if( !e )
//         throw new Error("Type is not an entity");
//     if( functionName && omm.PersistenceAnnotation.getCollectionUpdateFunctionNames(t).indexOf(<string>functionName)==-1 )
//         throw new Error("Function '"+functionName+"' is not a collection update function ");
//
//     if( !omm.eventListeners[className] ){
//         omm.eventListeners[className] = {};
//     }
//     var topic = "pre"+(typeof functionName =="string"?":"+functionName:"");
//     //console.log("topic:"+topic);
//     if( !omm.eventListeners[className][topic] )
//         omm.eventListeners[className][topic] = [];
//     omm.eventListeners[className][topic].push(f);
// }

export function callEventListeners<O extends Object>( t:omm.TypeClass<O>, topic:string, ctx:omm.EventContext<any>, data?:any ):Promise<void>{
    var className = omm.className(t);
    ctx.topic = topic;
    var promises = [];
    if( className && omm.eventListeners[className] && omm.eventListeners[className][topic] ){
        omm.eventListeners[className][topic].forEach( function(el:omm.EventListener<any>){
            try {
                var p = Promise.cast( el(ctx, data) );
                promises.push( p );
            }catch( e ){
                console.error("Exception in event listener for class '"+className+"' and topic '"+topic+"':", e);
            }
        });
    }

    if( topic.indexOf("pre:")!=0 && topic!="pre" && topic.indexOf("post:")!=0 && topic!="post" && className && omm.eventListeners[className] && omm.eventListeners[className]["_all"] ) {
        omm.eventListeners[className]["_all"].forEach(function (el:omm.EventListener<any>) {
            try{
                var p = Promise.cast( el(ctx, data) );
                promises.push( p );
            }catch( e ){
                console.error("Exception in event listener for class '"+className+"' and _all topic:", e);
            }
        });
    }
    return Promise.all(promises).thenReturn().catch((reason)=>{
        console.error('Error in callEventListeners',reason);
    });
}

export function removeAllUpdateEventListeners(){
    for( var i in omm.eventListeners )
        delete omm.eventListeners[i];
}

export function getQueue():Array<any>{
    return _queue.events;
}

var _queue:{events:Array<any>} = {events:[]};

export function resetQueue(){
    _queue.events = [];
    //console.log("reset",_queue);
}

export function emit( topic, data?:any ){
    //console.log("Emitting",_queue.events);
    if( _queue.events ) {
        _queue.events.push({
            topic: topic,
            data: data
        });
    }
    else{
        // drop this
    }
}

export function deleteQueue(){
    _queue =  {events:[]};
}


