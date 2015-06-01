module omm{
    export interface ObjectRetriever{
        getId(o:Object);
        getObject(s:string):Object;
        prepareForToDocument (o:Object);
    }
}
