import * as omm from "../../src/omm"
import * as Tests from "./Tests"

@omm.Entity("TestWheelBanzai")
export class TestWheel{

    @omm.Parent
    car:Tests.TestCar;
    
    radius:number;
}
