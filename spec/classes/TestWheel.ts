import * as reob from "../../src/reob"
import * as Tests from "./Tests"

@reob.Entity("TestWheelBanzai")
export class TestWheel{

    @reob.Parent
    car:Tests.TestCar;
    
    radius:number;
}
