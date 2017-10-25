/**
 * Created by bert on 14.10.16.
 */
import * as reob from "../../src/reob"
import {Request} from "../../src/Request"

export class TestRequest implements Request{
    
    constructor(public userData:any){
    }
    
}