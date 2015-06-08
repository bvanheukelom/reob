///<reference path="./references.d.ts"/>

module Tests{
    export class TestInheritanceParent {
        @omm.Type("TestInheritanceOther")
        parentOther : Tests.TestInheritanceOther;

        parentness:number;

    }
}
