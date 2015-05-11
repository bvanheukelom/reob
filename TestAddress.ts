/**
 * Created by bert on 04.05.15.
 */
///<reference path="references.d.ts"/>
module Tests
{

    @persistence.PersistenceAnnotation.Entity
    export class TestAddress {
        street:string;

        constructor(street:string) {
            this.street = street;
        }

        getStreet():string {
            return this.street;
        }
        getId():string {
            return this.street;
        }
    }
}