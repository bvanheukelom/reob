///<reference path="./references.d.ts"/>
module Tests {
    @omm.Entity
    export class TestInheritanceOther {
        name:string;
        otherness:number;

        public getSomething():string {
            return this.name + " " + this.otherness;
        }
    }
}