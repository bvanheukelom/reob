/**
 * Created by bert on 06.03.16.
 */

export interface EmitHandler {
    ( topic:string, data?:any ):void
}

var emitHandler:EmitHandler;

export function setEmitHandler( f:EmitHandler ){
    emitHandler = f;
}

export function emit( topic:string, data?:any ){
    if( emitHandler ){
        emitHandler( topic, data );
    }
}
