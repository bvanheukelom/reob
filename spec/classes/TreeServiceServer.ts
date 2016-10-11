/**
 * Created by bert on 07.10.16.
 */
import * as Tests from "./Tests"
import * as reob from "../../src/reob"

export class TreeServiceServer{
    treeCollection:Tests.TestTreeCollection;
    personCollection:Tests.TestPersonCollection;

    constructor(ttc:Tests.TestTreeCollection, tpc:Tests.TestPersonCollection, private session:reob.Session){
        this.treeCollection = ttc;
        this.personCollection = tpc;
        console.log("instantiated tree service with session", session);
    }

    @reob.Remote({serverOnly:true})
    insertTree( height:number ):Promise<Tests.TestTree>{
        var t = new Tests.TestTree(height);
        return this.treeCollection.insert(t,this.session).then((id:string)=>{
            return t;
        });
    }

    @reob.Remote({ serverOnly:true })
    growTree(treeId:string):Promise<string> {
        return this.treeCollection.getById(treeId,this.session).then((t:Tests.TestTree)=>{
            return t.growAsOnlyACollectionUpdate();
        });
    }

    @reob.Remote({ serverOnly:true })
    aTreeAndAPerson(treeId:string,personId:string):Promise<any> {
        return Promise.all([this.treeCollection.getByIdOrFail(treeId,this.session), this.personCollection.getByIdOrFail(personId,this.session)]);
    }
}