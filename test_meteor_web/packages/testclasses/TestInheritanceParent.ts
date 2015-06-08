///<reference path="./references.d.ts"/>

module Tests{
    export class TestInheritanceParent {
        @omm.Type("TestInheritanceOther")
        parentOther : Tests.TestInheritanceOther;

        @omm.Type("TestPerson")
        @omm.AsForeignKey
        person : Tests.TestPerson;

        parentness:number;

        @omm.Ignore
        ignoredOther : Tests.TestInheritanceOther;
    }
}
