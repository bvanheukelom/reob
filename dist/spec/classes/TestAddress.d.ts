import * as Tests from "./Tests";
export declare class TestAddress {
    street: string;
    person: Tests.TestPerson;
    constructor(street: string, person?: Tests.TestPerson);
    getStreet(): string;
}
