/**
 * Created by bert on 04.05.15.
 */
///<reference path="./references.d.ts"/>
module Tests
{

    @omm.Entity
    export class TestAddress {
        street:string;
        @omm.AsForeignKey
        @omm.Type("TestPerson")
        person:Tests.TestPerson;

        constructor(street:string, person?:Tests.TestPerson) {
            this.street = street;
            this.person = person;
        }

        getStreet():string {
            return this.street;
        }
    }
}