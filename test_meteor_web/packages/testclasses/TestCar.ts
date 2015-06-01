/// <reference path="./TestWheel.ts"/>
///<reference path="./references.d.ts"/>
module Tests{

    @omm.Entity
    export class TestCar{
        @omm.Type("TestWheel")
        wheel:Tests.TestWheel;

        @omm.ArrayOrMap("TestWheel")
        wheels:Array<Tests.TestWheel>=[];

        brand:string;

    }
}