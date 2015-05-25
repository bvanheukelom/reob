
module omm {
    export class ConstantObjectRetriever implements ObjectRetriever {
        private value:Object;

        constructor(o:Object) {
            this.value = o;
        }

        getId(o:Object) {
            return "constant";
        }

        getObject(s:string):Object {
            return this.value;
        }
        retrieveLocalKeys(o:Object):void{

        }
    }
}