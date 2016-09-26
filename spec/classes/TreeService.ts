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

    @omm.Remote({serverOnly:true, resultType:"TestTree"})
    insertTree( height:number ):Promise<Tests.TestTree>{
        var t = new Tests.TestTree(height);
        return this.treeCollection.insert(t).then((id:string)=>{
            return t;
        });
    }

    @omm.Remote({ serverOnly:true })
    growTree(treeId:string):Promise<string> {
        debugger;
        return this.treeCollection.getById(treeId).then((t:Tests.TestTree)=>{
            debugger;
            return t.growAsOnlyACollectionUpdate();
        });
    }

    @omm.Remote({ serverOnly:true })
    aTreeAndAPerson(treeId:string,personId:string):Promise<any> {
        return Promise.all([this.treeCollection.getByIdOrFail(treeId), this.personCollection.getByIdOrFail(personId)]);
    }
    
}
