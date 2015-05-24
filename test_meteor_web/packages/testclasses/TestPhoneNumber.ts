///<reference path="./references.d.ts"/>
module Tests {
    @omm.Entity
    export class TestPhoneNumber {
        number:string;

        constructor(n?:string) {
            this.number = n;
        }

        getNumber():string {
            return this.number;
        }
        getId():string {
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

        @omm.Wrap
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