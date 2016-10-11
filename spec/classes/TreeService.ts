/**
 * Created by bert on 10.07.16.
 */
import * as Tests from "./Tests"
import * as omm from "../../src/omm"

export class TreeService{


    constructor(){
    }

    @omm.Remote({serverOnly:true})
    insertTree( height:number ):Promise<Tests.TestTree>{
        return undefined;
    }

    @omm.Remote({ serverOnly:true })
    growTree(treeId:string):Promise<string> {
        return undefined;
    }

    @omm.Remote({ serverOnly:true })
    aTreeAndAPerson(treeId:string,personId:string):Promise<any> {
        return undefined;
    }
    
}
