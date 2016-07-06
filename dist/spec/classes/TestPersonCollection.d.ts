import * as omm from "../../src/omm";
import * as Tests from "./Tests";
export declare class TestPersonCollection extends omm.Collection<Tests.TestPerson> {
    constructor();
    newPerson(n: string): Promise<Tests.TestPerson>;
    haveBaby(mom: Tests.TestPerson, dad: Tests.TestPerson): Promise<Tests.TestPerson>;
    removePerson(id: string): Promise<void>;
    removeAllPersons(): Promise<void>;
}
