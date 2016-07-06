/**
 * Created by bert on 06.03.16.
 */
import * as omm from "../annotations/PersistenceAnnotation";
export declare function on<O extends Object>(t: omm.TypeClass<O>, topic: string | omm.EventListener, f?: omm.EventListener): void;
export declare function onUpdate<O extends Object>(t: omm.TypeClass<O>, functionName?: string | omm.EventListener, f?: omm.EventListener): void;
export declare function preUpdate<O extends Object>(t: omm.TypeClass<O>, functionName?: string | omm.EventListener, f?: omm.EventListener): void;
export declare function callEventListeners<O extends Object>(t: omm.TypeClass<O>, topic: string, ctx: omm.EventContext<any>, data?: any): void;
export declare function removeAllUpdateEventListeners(): void;
export declare function getQueue(): Array<any>;
export declare function resetQueue(): void;
export declare function emit(topic: any, data?: any): void;
export declare function deleteQueue(): void;
