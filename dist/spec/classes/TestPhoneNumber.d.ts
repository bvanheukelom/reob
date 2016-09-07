export declare class TestPhoneNumber {
    number: string;
    timesCalled: number;
    constructor(n?: string);
    getNumber(): string;
    static toDocument(t: TestPhoneNumber): {
        freak: string;
        pn: string;
    };
    static toObject(d: Document): TestPhoneNumber;
    callNumber(): string;
    callNumberFrantically(degreeOfUrgency: number, callback: (error: any, answer: string) => void): void;
}
