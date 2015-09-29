/// <reference path="./TestWheel.ts"/>
///<reference path="./references.d.ts"/>
module Tests{

    @omm.Entity
    export class TestCar{
        @omm.Type("TestWheelBanzai")
        wheel:Tests.TestWheel;

        @omm.ArrayOrMap("TestWheelBanzai")
        wheels:Array<Tests.TestWheel>=[];

        brand:string;

        @omm.Ignore
        temperature:string;

    }
}