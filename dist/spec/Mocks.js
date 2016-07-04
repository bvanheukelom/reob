/**
 * Created by bert on 23.03.16.
 */
/// <reference path="../typings/underscore/underscore.d.ts"/>
"use strict";
//
// export class MockCollection implements omm.MongoCollectionInterface{
//     name:string;
//     static data = {};
//     nextId:number = 0;
//     public finder:( pattern:any, allData:Array<any> ) => Array<any>;
//
//     constructor( name:string ){
//         this.name = name;
//     }
//
//     _ensureIndex(){
//
//     }
//
//     private getData():any{
//         if( !MockCollection.data[this.name] ){
//             MockCollection.data[this.name] = {}
//         }
//         return MockCollection.data[this.name];
//     }
//
//     getAllData(){
//         return MockCollection.data;
//     }
//
//     deepClone( o:any ):any{
//         var n = _.clone( o );
//         for( var i in n ){
//             if( typeof n[i]=="object" ){
//                 n[i] = this.deepClone(o[i]);
//             }
//         }
//         return n;
//     }
//
//     find( pattern:any ):MockCursor{
//         if( this.finder ) {
//             var r = this.finder(pattern,this.getData());
//             if( r )
//                 return new MockCursor(this.deepClone(r) );
//         }
//         if( pattern._id ){
//             return new MockCursor(this.deepClone([this.getData()[pattern._id]]));
//         } else
//             return new MockCursor(this.deepClone(_.values(this.getData())));
//     }
//     update( pattern, data ):number{
//         if( pattern._id ){
//             this.getData()[pattern._id] = data;
//             return 1;
//         }
//         else{
//             throw new Error("Not implemented: Cant update without an _id");
//         }
//     }
//
//     findOne( pattern:any ):MockCursor{
//         if( pattern._id )
//             return this.getData()[pattern._id];
//         else{
//             var v = _.values(this.getData());
//             if( v.length>0 ){
//                 return v[0];
//             }
//         }
//         return undefined;
//     }
//
//     nextID():string{
//         this.nextId++;
//         return this.nextId+"";
//     }
//
//     insert( i:any, cb?:(err?:any, id?:string)=>void   ){
//         if( !i._id )
//             i._id = this.nextID();
//         this.getData()[i._id] = i;
//         if( cb )
//             cb(undefined, i._id);
//         return i._id;
//     }
//
//     remove( id:string, cb?:(err?:any)=>void ){
//         delete this.getData()[id];
//         if( cb )
//             cb();
//
//     }
// }
//
// export class MockCursor implements omm.MongoCursorInterface{
//
//     data:any[];
//
//     constructor( data:any[] ){
//         this.data = data;
//     }
//
//     toArray():Prany[]{
//         return this.data;
//     }
//
// }
//
// export class MockObjectId{
//     static nextId:number = 0;
//
//     _str:string;
//     constructor(hex?:string){
//         this._str = ""+MockObjectId.nextId++;
//     }
// }
//
// export class MockMongo implements omm.MongoInterface{
//
//
//     constructor( ){
//     }
//
//     ObjectID = MockObjectId;
//     collection(n:string){
//         return new MockCollection(n);
//     }
// }
//
//
// export class MockError{
//     error:any;
//     reason:string;
//     details:string;
//     constructor(error: string | number, reason?: string, details?: string){
//         this.error = error;
//         this.details = details;
//         this.reason = reason;
//     }
// }
//
// export class MockMeteor implements omm.MeteorInterface{
//     theMethods = {};
//
//     Error = MockError;
//     users:omm.MongoCollectionInterface = new MockCollection('users');
//     isServer:boolean = true;
//     isClient:boolean = false;
//     call: (method:string, ...parameters:any[]) => void;
//
//     constructor(){
//         this.call = function( name:string, ...args:any[] ){
//             var f= this.theMethods[name];
//             var callback;
//             if( args.length>0 && typeof args[args.length-1] == "function" ){
//                 callback = args.pop();
//             }
//             var err;
//             var res;
//             try{
//                 res = f.apply( {}, args );
//             }catch( e ){
//                 err = e;
//             }
//             if( callback ){
//                 callback( err, res );
//             }
//         }.bind(this);
//     }
//
//
//     subscribe(name:string){
//
//     }
//     publish(name, f:()=>omm.MongoCursorInterface):void{
//         return undefined;
//     }
//
//     wrapAsync( f:Function ) : ()=>void {
//         return function(){
//             var res;
//             var err;
//             var hasBeenCalled:boolean = false;
//             f( function(e,r){
//                 res=r;
//                 err=e;
//                 hasBeenCalled = true;
//             });
//             while(!hasBeenCalled) {
//                 require('deasync').sleep(50);
//             }
//             if( err )
//                 throw err;
//             return res;
//         }
//     }
//
//     methods(dict:any){
//         _.extend(this.theMethods, dict);
//     }
// }
// export var mockMongo : MockMongo;
// export var mockMeteor : MockMeteor;
//
//
// export function resetDatabases(){
//     MockCollection.data = {};
// }
//
// export function init() {
//     mockMongo = new MockMongo();
//     mockMeteor = new MockMeteor();
//     omm.config( {
//         Meteor: mockMeteor,
//         Mongo: mockMongo
//     } );
// }
//# sourceMappingURL=Mocks.js.map