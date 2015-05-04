/**
 * Created by bert on 03.05.15.
 */
///<reference path="node_modules\reflect-metadata\reflect-metadata.d.ts"/>

import "reflect-metadata";


export function getCollectionName( f:Function )
{
    return Reflect.getMetadata("persistence:collection",  f);
}

export function getPropertyClass( f:Function, propertyName: string ):Function
{
    return Reflect.getMetadata("persistence:subdocument",  f, propertyName );
}

export function getSubDocumentPropertyNames( f:Function ):Array<string>
{
    console.log("all keys:",Reflect.getMetadataKeys(f));
    return [];
    //return Reflect.getMetadata("persistence:subdocument",  f, propertyName );
}

export function getCollectionClasses():Array<Function>
{
    return PersistencePrivate.collectionRootClasses;
}


class PersistencePrivate
{
    static collectionRootClasses:Array<Function> = [];
    // TODO this is duplicate code, needs resolving. Didn't want this to depend on code that currently lives on the meteor side.
    static functionName(fun:Function)
    {
        var ret = fun.toString();
        ret = ret.substr('function '.length);
        ret = ret.substr(0, ret.indexOf('('));
        return ret;
    }

    //getPersistedFunctionNames(c:PersistableClass):Array<string>
    //{
    //    var result:Array<string> = [];
    //    for( var propertyName in c )
    //    {
    //        var property:any = (<any>c)[propertyName];
    //        if( typeof property == "function" && property.persist == true)
    //        {
    //            result.push( propertyName );
    //        }
    //    }
    //    return result;
    //}

}

export function SubDocument(subdocumentConstructor:Function)
{
    return function (target: Function, propertyName:string) {
        //console.log("Classname "+subdocumentConstructor, target, propertyName);
        Reflect.defineMetadata("persistence:subdocument", subdocumentConstructor, target, propertyName);
    };
}

export function Collection( p1:string|Function ):any
{
    if( typeof p1=="string")
    {
        return function (target:Function) {
            console.log("collection name ", p1);
            Reflect.defineMetadata("persistence:collection", PersistencePrivate.functionName(<Function>p1), p1);
            PersistencePrivate.collectionRootClasses.push(<Function>p1);
        }
    }
    else
    {
        console.log("collection solo ",PersistencePrivate.functionName(<Function>p1));
        PersistencePrivate.collectionRootClasses.push(<Function>p1);
        Reflect.defineMetadata("persistence:collection", PersistencePrivate.functionName(<Function>p1), p1);
    }
}

export function Wrap( t:Function, functionName:string, objectDescriptor:any )
{
    console.log("wrapping "+functionName+" on "+t);
    //return function (target:Function, p2:any, p3:any) {
    //    console.log("wrapping 2",t,target,p2,p3);
    //    //Reflect.defineMetadata("persistence:wrap", true, (<any>t)[functionName]);
    //};
}
