import * as omm from "../../src/omm"
import * as Tests from "./Tests"

@omm.Entity
export class TestInheritanceOther {
    name:string;
    otherness:number;

    public getSomething():string {
        return this.name + " " + this.otherness;
    }
}
