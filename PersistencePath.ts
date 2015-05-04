/**
 * Created by bert on 04.05.15.
 */


class PersistencePathEntry
{
    fkt:string;
    arguments:Array<any>;
    index:number;

    clone():PersistencePathEntry
    {
        var pe = new PersistencePathEntry();
        pe.fkt = this.fkt;
        pe.arguments = this.arguments;
        pe.index = this.index;
        return pe;
    }
}

class PersistencePath
{
    private collection:any;
    private id:string;
    private callPath:Array<PersistencePathEntry>;

    constructor( collection:any, id:string )
    {
        this.collection = collection;
        this.id = id;
    }

    clone():PersistencePath
    {
        var r:PersistencePath = new PersistencePath(this.collection, this.id);
        if( this.callPath )
        {
            r.callPath = [];
            for( var i in this.callPath )
            {
                var entry = this.callPath[i];
                r.callPath.push( entry.clone() );
            }
        }
        return r;
    }
    private static apply( o:any, fktName:string, args:Array<any> )
    {
        if(o.isWrapped)
        {
            if(o[fktName].originalFunction)
            {
                return o[fktName].originalFunction.apply(o, args);
            }
        }
        else
            return o[fktName].apply(o,args);
    }


    followCallPath( o:any )
    {
        if( this.callPath )
        {
            for( var i=0;i< this.callPath.length;i++ )
            {
                var pathEntry:PersistencePathEntry = this.callPath[i];
                if(typeof pathEntry.index==="number")
                    o = o[pathEntry.index];
                else if(pathEntry.fkt)
                {
                    o = PersistencePath.apply(o, pathEntry.fkt, pathEntry.arguments);
                }
            }
        }
        return o;
    }

    appendIndex(i:number)
    {
        var pe = new PersistencePathEntry();
        pe.index = i;
        this.addEntry(pe);
    }

    appendFunctionCall( name:string, args:Array<any> )
    {
        var pe = new PersistencePathEntry();
        pe.fkt = name;
        pe.arguments = args;
        this.addEntry(pe);
    }

    private addEntry(pe:PersistencePathEntry)
    {
        if( !this.callPath )
            this.callPath = [];
        this.callPath.push( pe );
    }
}
export = PersistencePath
