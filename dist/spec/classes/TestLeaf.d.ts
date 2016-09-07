import * as Tests from "./Tests";
export declare class TestLeaf {
    _id: string;
    greenNess: number;
    parent: Tests.TestTree;
    constructor(id?: string, parent?: Tests.TestTree);
    getId(): string;
    grow(): void;
    getTree(): Tests.TestTree;
    flutter(): void;
}
