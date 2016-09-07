
import * as omm from "../../src/omm"
import * as Tests from "./Tests"

@omm.Entity
export class TestCar{
    @omm.Type("TestWheelBanzai")
    wheel:Tests.TestWheel;

    @omm.ArrayOrMap("TestWheelBanzai")
    wheels:Array<Tests.TestWheel>=[];

    brand:string;

    @omm.Ignore
    temperature:string;

    @omm.PrivateToServer
    privateToServer:string ='itsPrivate';

}
