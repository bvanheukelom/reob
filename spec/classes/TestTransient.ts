import * as reob from "../../src/reob"

@reob.Entity("TestTransient")
export class TestTransient{

    @reob.Ignore
    ignoredProperty:string;

    normalProperty:string;

    constructor( n:string ){
        this.normalProperty = n;
        this.initialize();
    }

    @reob.PostCreate
    initialize(){
        this.ignoredProperty = "hello "+this.normalProperty;
    }

}