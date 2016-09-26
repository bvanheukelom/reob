/**
 * Created by bert on 23.09.16.
 */
import * as omm from "./omm"

export interface EventListener<T> {
    (i:omm.EventContext<T>, data?:any) : void
}