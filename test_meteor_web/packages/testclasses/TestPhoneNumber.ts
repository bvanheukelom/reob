///<reference path="./references.d.ts"/>
module Tests {
    @mapper.Entity
    export class TestPhoneNumber {
        number:string;

        constructor(n:string) {
            this.number = n;
        }

        getNumber():string {
            return this.number;
        }
        getId():string {
            return this.number;
        }

        @mapper.Wrap
        callNumber( callback:( error:any, answer:string )=>void )
        {
            var that = this;
            console.log("Calling a phone number : ",callback)
            setTimeout(function(){
                callback( undefined, "Called:"+that.number );
            },300);
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
}