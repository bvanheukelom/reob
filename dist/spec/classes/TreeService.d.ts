/**
 * Created by bert on 10.07.16.
 */
import * as Tests from "./Tests";
export declare class TreeService {
    treeCollection: Tests.TestTreeCollection;
    constructor(ttc?: Tests.TestTreeCollection);
    insertTree(height: number): Promise<Tests.TestTree>;
}
