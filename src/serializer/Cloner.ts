/**
 * Created by bert on 02.05.16.
 */

export function clone( o:any ):any{
    return cloneInternally( o, {
        objects:[],
        clones:[]
    });
}

function cloneInternally( o:any, seenObjects?:{ objects:Array<any>, clones:Array<any> } ):any{
    if(Array.isArray(o)){
        var rArray = [];
        var arr:Array<any> = o;

        for( var j=0; j<arr.length; j++ ){
            rArray[j] = cloneInternally(o[j], seenObjects);
        }
        return rArray;
    } else if ( !o || typeof o == "string" || typeof o == "number"  ||  o instanceof Date || typeof o == "boolean" || typeof o == "function" )
        return o;
    else{
        var seenIndex = seenObjects.objects.indexOf(o);
        if( seenIndex!=-1 ){
            return seenObjects.clones[seenIndex];
        }else{
            var rObj = Object.create(o.constructor.prototype);
            seenObjects.objects.push(o);
            seenObjects.clones.push( rObj );
            for (var property in o) {
                if( o.hasOwnProperty(property) )
                    rObj[property] = cloneInternally(o[property], seenObjects);
            }
            return rObj;
        }
    }
}