import * as Tests from "./Tests";
export declare class TestTree {
    treeId: string;
    private height;
    leaves: Array<Tests.TestLeaf>;
    address: Tests.TestAddress;
    constructor(initialHeight?: number);
    grow(): string;
    wither(): void;
    thisThrowsAnError(): void;
    getHeight(): number;
    getLeaves(): Array<Tests.TestLeaf>;
    growAndReturnLeaves(): Array<Tests.TestLeaf>;
}
