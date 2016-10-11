import * as reob from "../../src/reob"
import * as Tests from "./Tests"

@reob.Entity
export class TestInheritanceOther {
    name:string;
    otherness:number;

    public getSomething():string {
        return this.name + " " + this.otherness;
    }
}
