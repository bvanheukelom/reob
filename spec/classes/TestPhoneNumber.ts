import * as reob from "../../src/reob"
import * as Tests from "./Tests"

@reob.Entity
export class TestPhoneNumber {
    number:string;
    timesCalled:number;

    constructor(n?:string) {
        this.number = n;
        this.timesCalled = 0;
    }

    getNumber():string {
        return this.number;
    }


    static toDocument(t:TestPhoneNumber){
        return {
            freak:"show",
            pn:t.number
        };
    }
    static toObject( d:Document ){
        var dn:any = d;
        if( !dn || !dn.freak )
            throw new Error("not freaky enough");
        return new TestPhoneNumber(dn.pn);
    }

    @reob.RemoteCollectionUpdate
    callNumber( ):string
    {
        this.timesCalled++;
        //console.log("Calling a phone number : ",this.number);
        return "Calling a phone number : "+this.number;
    }
    callNumberFrantically( degreeOfUrgency:number, callback:( error:any, answer:string )=>void )
    {
        var that = this;
        console.log("Calling a phone number : ",callback)
        setTimeout(function(){
            callback( undefined, "Called:"+that.number+" "+degreeOfUrgency+" time(s)" );
        },300);
    }

}