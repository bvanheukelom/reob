module omm{
    export interface ObjectRetriever{
        getId(o:Object);
        getObject(s:string):Object;
        //retrieveLocalKeys(o:Object):void;
    }
}
