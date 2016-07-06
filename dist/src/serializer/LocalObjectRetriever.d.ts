import ObjectRetriever from "./ObjectRetriever";
export default class LocalObjectRetriever implements ObjectRetriever {
    constructor();
    private setQuietProperty(obj, propertyName, value);
    getId(o: Object): string;
    getObject(s: string, parentObject?: Object, propertyName?: string): Promise<Object>;
    preToDocument(o: Object): void;
    postToObject(o: Object): void;
}
