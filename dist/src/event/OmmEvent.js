/**
 * Created by bert on 06.03.16.
 */
"use strict";
var omm = require("../annotations/PersistenceAnnotation");
var Promise = require("bluebird");
function on(t, topic, f) {
    var className = omm.className(t);
    if (typeof topic == "function") {
        f = topic;
        topic = null;
    }
    var e = omm.PersistenceAnnotation.getEntityClassByName(className);
    if (!e)
        throw new Error("Type is not an entity");
    if (!omm.eventListeners[className]) {
        omm.eventListeners[className] = {};
    }
    if (topic) {
        if (!omm.eventListeners[className][topic])
            omm.eventListeners[className][topic] = [];
        omm.eventListeners[className][topic].push(f);
    }
    else {
        if (!omm.eventListeners[className]["_all"])
            omm.eventListeners[className]["_all"] = [];
        omm.eventListeners[className]["_all"].push(f);
    }
}
exports.on = on;
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
function callEventListeners(t, topic, ctx, data) {
    var className = omm.className(t);
    ctx.topic = topic;
    var promises = [];
    if (className && omm.eventListeners[className] && omm.eventListeners[className][topic]) {
        omm.eventListeners[className][topic].forEach(function (el) {
            try {
                var p = Promise.cast(el(ctx, data));
                promises.push(p);
            }
            catch (e) {
                console.error("Exception in event listener for class '" + className + "' and topic '" + topic + "':", e);
            }
        });
    }
    if (topic.indexOf("pre:") != 0 && topic != "pre" && topic.indexOf("post:") != 0 && topic != "post" && className && omm.eventListeners[className] && omm.eventListeners[className]["_all"]) {
        omm.eventListeners[className]["_all"].forEach(function (el) {
            try {
                var p = Promise.cast(el(ctx, data));
                promises.push(p);
            }
            catch (e) {
                console.error("Exception in event listener for class '" + className + "' and _all topic:", e);
            }
        });
    }
    return Promise.all(promises).thenReturn().catch(function (reason) {
        console.error('Error in callEventListeners', reason);
    });
}
exports.callEventListeners = callEventListeners;
function removeAllUpdateEventListeners() {
    for (var i in omm.eventListeners)
        delete omm.eventListeners[i];
}
exports.removeAllUpdateEventListeners = removeAllUpdateEventListeners;
function getQueue() {
    return _queue.events;
}
exports.getQueue = getQueue;
var _queue = { events: [] };
function resetQueue() {
    _queue.events = [];
    //console.log("reset",_queue);
}
exports.resetQueue = resetQueue;
function emit(topic, data) {
    //console.log("Emitting",_queue.events);
    if (_queue.events) {
        _queue.events.push({
            topic: topic,
            data: data
        });
    }
    else {
    }
}
exports.emit = emit;
function deleteQueue() {
    _queue = { events: [] };
}
exports.deleteQueue = deleteQueue;
//# sourceMappingURL=OmmEvent.js.map