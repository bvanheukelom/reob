/**
 * Created by bert on 19.10.16.
 */
import * as Promise from "bluebird"
/**
 * @hidden
 */
export class EventListenerRegistry{

    private globalListeners:Array<any> = [];
    private topicListeners:{ [index:string]:Array<any> } = {};
    private subTopicListeners:{ [index:string]:{ [index:string]:Array<any>} } = {};

    public on( topic:string, subTopic:string, handler:Function ){
        if( typeof topic==="undefined" && typeof subTopic==="undefined" && typeof handler==="undefined" ){
            this.addGlobalListener( handler );
        }else if( topic && typeof subTopic==="undefined" && handler ){
            this.addTopicListener( topic, handler );
        }else if(topic && subTopic && handler ){
            this.addSubTopicListener( topic, subTopic, handler );
        }else{
            throw new Error( "Illegal combination of parameters for EventListenerRegistry.on ." );
        }
    }

    public removeAllListeners():void{
        this.globalListeners = [];
        this.topicListeners = {};
        this.subTopicListeners = {};
    }

    public emit( topic:string, subTopic:string, eventArgs:any[] ):Promise<void>{
        var promises:Array<Promise<any>> = [];
        if( typeof topic !=="undefined" && typeof subTopic !=="undefined" && this.subTopicListeners[topic] &&  this.subTopicListeners[topic][subTopic] ){
            this.subTopicListeners[topic][subTopic].forEach( (h:Function)=>{
                promises.push( Promise.cast(h.apply(undefined, eventArgs)) );
            });
        }
        if( typeof topic !=="undefined" && this.topicListeners[topic]  ) {
            this.topicListeners[topic].forEach( (h:Function)=>{
                promises.push( Promise.cast(h.apply(undefined, eventArgs)) );
            });
        }
        this.globalListeners.forEach( (h:Function)=>{
            promises.push( Promise.cast(h.apply(undefined, eventArgs)) );
        });
        return Promise.all(promises).then(()=>{});
    }

    public removeEventListener( topic:string, subTopic:string, handler:Function ) {
        if( typeof topic == "function" && !subTopic && !handler ) {
            this.removeGlobalListener( handler );
        } else if( typeof topic === "string" && typeof subTopic === "function" && typeof handler === "undefined" ) {
            this.removeTopicListener( topic, handler );
        } else if( typeof topic === "string" && typeof subTopic === "function" &&  typeof handler === "function") {
            this.removeSubTopicListener( topic, subTopic, handler );
        } else{
            throw new Error( "Illegal combination of parameters for EventListenerRegistry.removeEventListener ." );
        }
    }

    private addGlobalListener( handler:Function ):void {
        this.globalListeners.push( handler );
    }

    private removeGlobalListener( handler:Function ):void {
        var index = this.globalListeners.indexOf(handler);
        if( index!=-1 ){
            this.globalListeners.splice(index,1);
        }
    }

    private addTopicListener( topic:string, handler:Function ):void {
        if( !this.topicListeners[topic] ){
            this.topicListeners[topic] = [];
        }
        this.topicListeners[topic].push(handler);
    }

    private removeTopicListener( topic:string, handler:Function ):void {
        if( this.topicListeners[topic] ) {
            var index = this.topicListeners[topic].indexOf(handler);
            if (index != -1) {
                this.topicListeners[topic].splice(index, 1);
            }
        }
    }

    private addSubTopicListener( topic:string, subTopic:string, handler:Function ):void {
        if( !this.subTopicListeners[topic] ){
            this.subTopicListeners[topic] = {};
        }
        if( !this.subTopicListeners[topic][subTopic] ){
            this.subTopicListeners[topic][subTopic] = [];
        }
        this.subTopicListeners[topic][subTopic].push(handler);
    }


    private removeSubTopicListener( topic:string, subTopic:string, handler:Function ):void {
        if( this.subTopicListeners[topic] && this.subTopicListeners[topic][subTopic] ){
            var index = this.subTopicListeners[topic][subTopic].indexOf(handler);
            if (index != -1) {
                this.subTopicListeners[topic][subTopic].splice(index, 1);
            }
        }
    }

}