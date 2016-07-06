import * as Tests from "./Tests";
export declare class TestPerson {
    name: string;
    gardenState: number;
    _id: string;
    phoneNumber: Tests.TestPhoneNumber;
    addresses: Array<Tests.TestAddress>;
    tree: Tests.TestTree;
    leaf: Tests.TestLeaf;
    trees: Array<Tests.TestTree>;
    phoneBook: {
        [index: string]: Tests.TestPhoneNumber;
    };
    wood: {
        [index: string]: Tests.TestTree;
    };
    family: {
        [index: string]: Tests.TestPerson;
    };
    constructor(id?: string, name?: string);
    getId(): string;
    setId(id: string): void;
    getName(): string;
    getAddresses(): Array<Tests.TestAddress>;
    getTree(): Tests.TestTree;
    collectLeaf(): void;
    chooseTree(t: Tests.TestTree): void;
    chooseLeaf(l: Tests.TestLeaf): void;
    rename(n: string): string;
    collectionUpdateRename(n: string): string;
    addAddress(a: Tests.TestAddress): Tests.TestAddress;
    addAddresses(addresses: Array<Tests.TestAddress>): Array<Tests.TestAddress>;
    addToWood(t: Tests.TestTree, s?: string): void;
    addFamilyRelation(s: string, p: Tests.TestPerson): void;
    addPhoneNumber(s: string, p: Tests.TestPhoneNumber): void;
    tendToGarden(): number;
}
