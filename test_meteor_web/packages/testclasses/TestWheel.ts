/// <reference path="./TestCar.ts"/>
module Tests{

    @omm.Entity
    export class TestWheel{
        @omm.Type("TestCar")
        @omm.AsForeignKey
        car:Tests.TestCar;
        radius:number;
    }
}
