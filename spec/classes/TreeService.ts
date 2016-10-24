/**
 * Created by bert on 10.07.16.
 */
import * as Tests from "./Tests"
import * as reob from "../../src/reob"

export class TreeService {


    constructor() {
    }

    @reob.Remote({serverOnly: true})
    insertTree(height: number): Promise<Tests.TestTree> {
        return undefined;
    }

    @reob.Remote({serverOnly: true})
    growTree(treeId: string): Promise<string> {
        return undefined;
    }

    @reob.Remote({serverOnly: true})
    aTreeAndAPerson(treeId: string, personId: string): Promise<any> {
        return undefined;
    }

    @reob.Remote({serverOnly: true})
    removeTree(treeId: string): Promise<any> {
        return undefined;
    }

    @reob.Remote({serverOnly: true})
    setSomeBooleanOnTree(treeId: string, b: boolean): Promise<string> {
        return undefined;
    }
}