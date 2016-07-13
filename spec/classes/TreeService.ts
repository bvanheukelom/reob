/**
 * Created by bert on 10.07.16.
 */
import * as Tests from "./Tests"
import * as omm from "../../src/omm"

export class TreeService{

    treeCollection:Tests.TestTreeCollection;
    personCollection:Tests.TestPersonCollection;

    constructor(ttc?:Tests.TestTreeCollection, tpc?:Tests.TestPersonCollection){
        this.treeCollection = ttc;
        this.personCollection = tpc;
    }

    @omm.MeteorMethod({serverOnly:true, resultType:"TestTree"})
    insertTree( height:number ):Promise<Tests.TestTree>{
        var t = new Tests.TestTree(height);
        return this.treeCollection.insert(t).then((id:string)=>{
            return t;
        });
    }

    @omm.MeteorMethod({ serverOnly:true })
    growTree(treeId:string):Promise<string> {
        return this.treeCollection.getById(treeId).then((t:Tests.TestTree)=>{
            return t.growAsOnlyACollectionUpdate();
        });
    }

    @omm.MeteorMethod({ serverOnly:true })
    aTreeAndAPerson(treeId:string,personId:string):Promise<any> {
        return Promise.all([this.treeCollection.getByIdOrFail(treeId), this.personCollection.getByIdOrFail(personId)]);
    }
    
}