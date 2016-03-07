
module omm {
    export interface Document {
        _id?:string;
        serial?:number;
        className?:string;
        [x: string]: any;
    }
}