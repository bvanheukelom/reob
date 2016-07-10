/**
 * Created by bert on 10.07.16.
 */
import * as Tests from "./Tests"
import * as omm from "../../src/omm"

export class TreeService{

    treeCollection:Tests.TestTreeCollection;
    constructor(ttc?:Tests.TestTreeCollection){
        this.treeCollection = ttc;
    }

    @omm.MeteorMethod({serverOnly:true, resultType:"TestTree"})
    insertTree( height:number ):Promise<Tests.TestTree>{
        var t = new Tests.TestTree(height);
        return this.treeCollection.insert(t).then((id:string)=>{
            return t;
        });
    }

}