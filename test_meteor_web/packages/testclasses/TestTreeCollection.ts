/**
 * Created by bert on 13.05.15.
 */
///<reference path="./references.d.ts"/>
module Tests {


    export class TestTreeCollection extends omm.Collection<Tests.TestTree> {
        constructor() {
            super(Tests.TestTree,"TheTreeCollection");
        }
        @omm.MeteorMethod({object:'TestTreeCollection', replaceWithCall:true, parameterTypes:["number","callback"]})
        newTree(initialHeight:number, callback:(err:any, tree?:Tests.TestTree)=>void):void {
            var t:Tests.TestTree = new Tests.TestTree(initialHeight);
            var that = this;
            try {
                var id:string = this.insert( t, function(err,id:string){
                    console.log("error while inserting new tree:", err);
                    if( err )
                        callback(err);
                    else
                        callback(undefined, that.getById(id));
                });
            } catch (err) {
                callback(err);
            }
        }
        @omm.MeteorMethod({object:'TestTreeCollection', replaceWithCall:true, parameterTypes:["number","callback"]})
        errorMethod(initialHeight:number, callback:(err:any, result?:any)=>void):void {
            callback("the error");
        }

        @omm.MeteorMethod({object:'TestTreeCollection', replaceWithCall:true, parameterTypes:["string","callback"]})
        deleteTree(treeId:string, cb:(err:any)=>void) {
            this.remove(treeId, cb);
        }

        @omm.MeteorMethod({object:'TestTreeCollection', replaceWithCall:true, parameterTypes:[ "string", "TestTree", "number", "callback" ]})
        serverFunction(treeId:string, t:Tests.TestTree, n:number, cb:(e:any, r:string)=>void) {
            cb(undefined, "Hello " + treeId + "! This is on the " + (Meteor.isServer ? "server" : "client") + " t:" + (t instanceof Tests.TestTree) + " " + t.getHeight() + " n:" + n + " " + (typeof n));
        }

    }
    export var registeredTestTreeCollection = new Tests.TestTreeCollection();
}

if( Meteor.isServer ) {
    Meteor.publish("trees", function(){
        return omm.MeteorPersistence.collections["TheTreeCollection"].getMeteorCollection().find({});
    });
}
else
{
    Meteor.subscribe("trees");
}

omm.registerObject('TestTreeCollection', Tests.registeredTestTreeCollection);