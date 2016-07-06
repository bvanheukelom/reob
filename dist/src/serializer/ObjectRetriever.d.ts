interface ObjectRetriever {
    getId(o: Object): any;
    getObject(value: string, parentObject?: Object, propertyName?: string): Promise<Object>;
    preToDocument(o: Object): any;
    postToObject(o: Object): any;
}
export default ObjectRetriever;
