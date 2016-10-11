/**
 * Created by bert on 23.09.16.
 */
import * as reob from "./reob"

export interface EventListener<T> {
    (i:reob.EventContext<T>, data?:any) : void
}