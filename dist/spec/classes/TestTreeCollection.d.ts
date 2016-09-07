/**
 * Created by bert on 13.05.15.
 */
import * as omm from "../../src/omm";
import * as Tests from "./Tests";
export declare class TestTreeCollection extends omm.Collection<Tests.TestTree> {
    constructor(db?: any);
    newTree(initialHeight: number): Promise<Tests.TestTree>;
    errorMethod(initialHeight: number): Promise<any>;
    deleteTree(treeId: string): Promise<void>;
    serverFunction(treeId: string, t: Tests.TestTree, n: number): string;
    removeAllTrees(): Promise<void>;
}
