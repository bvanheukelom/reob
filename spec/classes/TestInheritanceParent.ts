import * as reob from "../../src/reob"
import * as Tests from "./Tests"

@reob.Entity
export class TestInheritanceParent {
    @reob.Type("TestInheritanceOther")
    parentOther : Tests.TestInheritanceOther;

    @reob.Type("TestPerson")
    // @omm.AsForeignKey
    person : Tests.TestPerson;

    parentness:number;

    @reob.Ignore
    ignoredOther : Tests.TestInheritanceOther;
}

