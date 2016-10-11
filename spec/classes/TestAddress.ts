/**
 * Created by bert on 04.05.15.
 */
import * as reob from "../../src/reob"
import * as Tests from "./Tests"

@reob.Entity
export class TestAddress {
    street:string;

    @reob.Parent
    person:Tests.TestPerson;

    constructor(street:string, person?:Tests.TestPerson) {
        this.street = street;
        this.person = person;
    }

    getStreet():string {
        return this.street;
    }
}
