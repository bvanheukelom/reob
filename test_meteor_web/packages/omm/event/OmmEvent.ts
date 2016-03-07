/**
 * Created by bert on 06.03.16.
 */
    ///<reference path="../../../../typings/meteor/meteor.d.ts"/>
///<reference path="../annotations/PersistenceAnnotation.ts"/>
///<reference path="../omm/Collection.ts"/>
///<reference path="../omm/MeteorObjectRetriever.ts"/>
module omm {
    export class EventContext<T>{
        private  cancelledError:any = false;
        preUpdate:T;
        object:T;
        collection:omm.Collection<T>;
        rootObject:any;
        methodContext:any;
        functionName:string;
        serializationPath:omm.SerializationPath;
        topic:string;

        constructor( o:T, coll:omm.Collection<T> ){
            this.object = o;
            this.collection = coll;
        }

        cancel(err:any):void{
            this.cancelledError = err;
        }

        cancelledWithError():any{
            return this.cancelledError;
        }
    }



    export function on<O extends Object>( t:TypeClass<O>, topic:string|EventListener,  f?:EventListener ):void {
        var className = omm.className(t);
        if( typeof topic == "function" ){
            f = <EventListener>topic;
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

    export function onUpdate<O extends Object>(  t:TypeClass<O>, functionName?:string|EventListener, f?:EventListener ):void {
        var className = omm.className(t);
        if( typeof functionName == "function" ){
            f = <EventListener>functionName;
            functionName = null;
        }

        var e= omm.PersistenceAnnotation.getEntityClassByName(className);
        if( !e )
            throw new Error("Type is not an entity");
        if( functionName && omm.PersistenceAnnotation.getCollectionUpdateFunctionNames(t).indexOf(<string>functionName)==-1 )
            throw new Error("Function '"+functionName+"' is not a collection update function");

        if( !omm.eventListeners[className] ){
            omm.eventListeners[className] = {};
        }
        var topic = "post"+(functionName?":"+functionName:"");
        if( !omm.eventListeners[className][topic] )
            omm.eventListeners[className][topic] = [];
        omm.eventListeners[className][topic].push(f);
    }

    export function preUpdate<O extends Object>(  t:TypeClass<O>, functionName?:string|EventListener, f?:EventListener ):void {
        var className = omm.className(t);
        if( typeof functionName == "function" ){
            f = <EventListener>functionName;
            functionName = null;
        }

        var e= omm.PersistenceAnnotation.getEntityClassByName(className);
        if( !e )
            throw new Error("Type is not an entity");
        if( functionName && omm.PersistenceAnnotation.getCollectionUpdateFunctionNames(t).indexOf(<string>functionName)==-1 )
            throw new Error("Function '"+functionName+"' is not a collection update function ");

        if( !omm.eventListeners[className] ){
            omm.eventListeners[className] = {};
        }
        var topic = "pre"+(typeof functionName =="string"?":"+functionName:"");
        console.log("topic:"+topic);
        if( !omm.eventListeners[className][topic] )
            omm.eventListeners[className][topic] = [];
        omm.eventListeners[className][topic].push(f);
    }

    export function callEventListeners<O extends Object>( t:TypeClass<O>, topic:string, ctx:omm.EventContext<any>, data?:any ){
        var className = omm.className(t);
        ctx.topic = topic;
        if( className && omm.eventListeners[className] && omm.eventListeners[className][topic] ){
            omm.eventListeners[className][topic].forEach( function(el:EventListener){
                el( ctx, data );
            });
        }

        if( topic.indexOf("pre:")!=0 && topic!="pre" && topic.indexOf("post:")!=0 && topic!="post" && className && omm.eventListeners[className] && omm.eventListeners[className]["_all"] ) {
            omm.eventListeners[className]["_all"].forEach(function (el:EventListener) {
                el( ctx, data );
            });
        }
    }

    export function removeAllUpdateEventListeners(){
        for( var i in omm.eventListeners )
            delete omm.eventListeners[i];
    }

    export var _queue:Array<any>;

    export function resetQueue(){
        omm._queue = [];
    }

    export function emit( topic, data?:any ){
        if( omm._queue ) {
            omm._queue.push({
                topic: topic,
                data: data
            });
        }
        else{
            // drop this
        }
    }

    export function deleteQueue(){
        omm._queue = undefined;
    }


}
