/**
 * Created by bert on 07.10.16.
 */
import * as Tests from "./Tests"
import * as reob from "../../src/reob"
import {Request} from "../../src/Request"

export class TreeServiceServer{
    treeCollection:Tests.TestTreeCollection;
    personCollection:Tests.TestPersonCollection;

    constructor(ttc:Tests.TestTreeCollection, tpc:Tests.TestPersonCollection, private request:Request){
        this.treeCollection = ttc;
        this.personCollection = tpc;
        console.log("instantiated tree service with request", request);
    }

    @reob.Remote({serverOnly:true})
    insertTree( height:number ):Promise<Tests.TestTree>{
        var t = new Tests.TestTree(height);
        return this.treeCollection.insert(t,this.request).then((id:string)=>{
            return t;
        });
    }

    @reob.Remote({ serverOnly:true })
    growTree(treeId:string):Promise<string> {
        return this.treeCollection.getById(treeId,this.request).then((t:Tests.TestTree)=>{
            return t.growAsOnlyACollectionUpdate();
        });
    }
    @reob.Remote({ serverOnly:true })
    setSomeBooleanOnTree(treeId:string, b:boolean):Promise<string> {
        return this.treeCollection.getByIdOrFail(treeId,this.request).then((t:Tests.TestTree)=>{
            return t.setSomeBooleanTo(b);
        }).then((s:string)=>{
            return "added in the service:"+s;
        });
    }

    @reob.Remote({ serverOnly:true })
    aTreeAndAPerson(treeId:string,personId:string):Promise<any> {
        return Promise.all([this.treeCollection.getByIdOrFail(treeId,this.request), this.personCollection.getByIdOrFail(personId,this.request)]);
    }

    @reob.Remote({ serverOnly:true })
    removeTree(treeId:string):Promise<any> {
        return this.treeCollection.deleteTree(treeId, this.request);
    }

}