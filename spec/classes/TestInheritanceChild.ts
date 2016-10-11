
import * as reob from "../../src/reob"
import * as Tests from "./Tests"

@reob.Entity
export class TestInheritanceChild extends Tests.TestInheritanceParent {

    @reob.Type("TestInheritanceOther")
        childOther:Tests.TestInheritanceOther;

    public getChildThing():string {
        return this.childOther.getSomething() + " " + this.parentOther.getSomething();
    }

}
