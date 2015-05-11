///<reference path="references.d.ts"/>
module Tests {
@persistence.PersistenceAnnotation.Entity
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
    }
}