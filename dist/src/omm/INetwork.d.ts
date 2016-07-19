/**
 * Created by bert on 17.07.16.
 */
export interface INetwork {
    on(eventName: string, handler: (data: any) => void): any;
    removeListener(eventName: string, handler: (data: any) => void): any;
    emit(eventName: string, data: any): any;
}
