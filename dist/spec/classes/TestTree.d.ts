import * as Tests from "./Tests";
export declare class TestTree {
    treeId: string;
    private height;
    someArray: Array<any>;
    creationDate: Date;
    leaves: Array<Tests.TestLeaf>;
    address: Tests.TestAddress;
    constructor(initialHeight?: number);
    grow(): string;
    _grow(): string;
    growAsOnlyACollectionUpdate(): string;
    wither(): void;
    thisThrowsAnError(): void;
    getHeight(): number;
    getLeaves(): Array<Tests.TestLeaf>;
    growAndReturnLeaves(): Array<Tests.TestLeaf>;
}
