/**
 * Created by bert on 10.07.16.
 */
import * as Tests from "./Tests";
export declare class TreeService {
    treeCollection: Tests.TestTreeCollection;
    personCollection: Tests.TestPersonCollection;
    constructor(ttc?: Tests.TestTreeCollection, tpc?: Tests.TestPersonCollection);
    insertTree(height: number): Promise<Tests.TestTree>;
    growTree(treeId: string): Promise<string>;
    aTreeAndAPerson(treeId: string, personId: string): Promise<any>;
}
