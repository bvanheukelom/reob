/**
 * Created by bert on 12.10.16.
 */
import * as reob from "../../src/reob"
import {TestCar} from "./TestCar"
import {Collection} from "../../src/Collection"

export class TestCarCollection extends Collection<TestCar>{
    constructor(){
        super( TestCar, "testcar" );
    }
}