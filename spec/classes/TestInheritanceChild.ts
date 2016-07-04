
import * as omm from "../../src/omm"
import * as Tests from "./Tests"

@omm.Entity
export class TestInheritanceChild extends Tests.TestInheritanceParent {

    @omm.Type("TestInheritanceOther")
        childOther:Tests.TestInheritanceOther;

    public getChildThing():string {
        return this.childOther.getSomething() + " " + this.parentOther.getSomething();
    }

}
