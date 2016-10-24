/**
 * Created by bert on 23.03.16.
 */
import * as reob from "../src/serverModule"
reob.setVerbose( true );

import * as Tests from "./classes/Tests"
import * as Promise from "bluebird"
var co = require("co");

import "./classes/TestLeaf"

//jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000000;

Promise.onPossiblyUnhandledRejection((reason: any) => {
    console.log("possibly unhandled rejection ", reason);
    debugger;
});

function spyOnAndCallThrough<FKT extends Function>( f:FKT ):FKT{
    var l = {listener:f};
    spyOn(l, "listener").and.callThrough();
    return <any>l.listener;
}

describe("Reob", function () {

    var personCollection:Tests.TestPersonCollection;
    var treeCollection:Tests.TestTreeCollection;
    var clientTreeService:Tests.TreeService;
    var carCollection:Tests.TestCarCollection;
    var server:reob.Server;
    var client:reob.Client;

    beforeAll((done)=>{

        server = new reob.Server("mongodb://localhost/test");

        personCollection = new Tests.TestPersonCollection();
        server.addCollection(personCollection);

        carCollection = new Tests.TestCarCollection();
        server.addCollection(carCollection);
        server.setLoadingAllowed(carCollection,  (id, session, car:Tests.TestCar)=>{
            console.log('checking whether a car can be loaded', car, session);
            expect( car ).toBeDefined();
            expect( car.brand ).toBe("bmw");
            if( session.userData && session.userData.userId=='bert')
                return Promise.resolve('yay');
            else
                return Promise.reject(new Error("nay"));
        });

        treeCollection = new Tests.TestTreeCollection();
        server.addCollection( treeCollection );
        server.setLoadingAllowed( treeCollection, (id, session)=>{
            return Promise.resolve();
        });
        server.addService("treeService", (request:reob.Request)=>{
            return new Tests.TreeServiceServer( treeCollection, personCollection, request );
        });

        client = new reob.Client('localhost', 22222);
        clientTreeService = new Tests.TreeService();
        client.addService( "treeService", clientTreeService );
        server.start(22222).then(()=>{
            console.log("Server started");
            done();
        });
    });

    var count =0;
    beforeEach(()=>{
        count++;
        reob.setVerbose( true );
        server.setRequestFactory(undefined);

        console.log("-------"+(count));
        // console.log(jasmine.getEnv().currentSpec.getFullName());
        personCollection.removeAllListeners();
        treeCollection.removeAllListeners();
        server.removeAllMethodListeners();
        
    });

    it("isVerbose", function () {
        expect(reob.isVerbose()).toBeTruthy();
        reob.setVerbose(false);
        expect(reob.isVerbose()).toBeFalsy();
    });
    
    it("knows method annotations ", function () {
        var methodNames = reob.Reflect.getRemoteFunctionNames(Tests.TestPerson);
        expect(methodNames).toContain("addAddress");
        expect(methodNames.length).toBeGreaterThan(0);
    });

    it("knows the name of collections", function () {
        expect(personCollection.getName()).toBe("TestPerson");
        expect(treeCollection.getName()).toBe("TheTreeCollection");
    });

    it("knows collection updates", function () {
        expect(reob.Reflect.getCollectionUpdateFunctionNames(Tests.TestPerson)).toBeDefined();
        expect(reob.Reflect.getCollectionUpdateFunctionNames(Tests.TestPerson)).toContain("collectionUpdateRename");
    });

    it("can clone stuff", function () {
        var t1:Tests.TestTree = new Tests.TestTree(10);
        t1.grow();
        var clone = reob.clone(t1);
        expect( clone instanceof Tests.TestTree ).toBeTruthy();
    });


    it("can load objects that have sub objects", function (done) {
        var id = Date.now()+"t444";
        var t1:Tests.TestPerson = new Tests.TestPerson(id);
        t1.phoneNumber = new Tests.TestPhoneNumber("1212");
        personCollection.insert(t1).then( (id:string)=> {
            return personCollection.getById(id);
        }).then((p:Tests.TestPerson)=>{
            expect(p).toBeDefined();
            expect(p.phoneNumber instanceof Tests.TestPhoneNumber).toBeTruthy();
            done();

        });
    });

    it("can run collection updates from within another method", function (done) {
        var t1:Tests.TestTree = new Tests.TestTree(15);
        treeCollection.insert(t1).then( (id:string)=> {
            debugger;
            return clientTreeService.growTree( id ).thenReturn( id );
        }).then((id)=>{
            return treeCollection.getByIdOrFail(id);
        }).then((t)=>{
            expect( t.getLeaves().length ).toBe(1);
            done();
        });
    });

    it("can run collection updates from within another method and the userdata remains", function (done) {
        var t1:Tests.TestTree = new Tests.TestTree(15);
        var h:reob.UpdateEventListener<Tests.TestTree> = ( updateEvent:reob.UpdateEvent<Tests.TestTree> )=>{
            expect( updateEvent.request ).toBeDefined();
            // expect( evtCtx.request.userData ).toBeDefined();
            // expect( evtCtx.request.userData.hello ).toBe("World");
        };
        var f = { handle:h };
        spyOn(f, "handle").and.callThrough();
        client.setUserData({hello:"World"});
        treeCollection.onAfterUpdate(f.handle);
        treeCollection.insert(t1).then( (id:string)=> {
            debugger;
            return clientTreeService.growTree( id ).thenReturn( id );
        }).then((id)=>{
            expect( f.handle ).toHaveBeenCalled();
            done();
        });
    });

    it("can load objects that have sub objects (in an array) which have a parent reference ", function (done) {
        var t1:Tests.TestTree = new Tests.TestTree(10);
        var i;
        treeCollection.insert(t1).then((id:string)=>{
            i = id;
            return treeCollection.getById(id);
        }).then((t:Tests.TestTree)=> {
            return t.grow();
        }).then(()=>{
            return treeCollection.getById(i);
        }).then((t:Tests.TestTree)=>{
            treeCollection
            expect(t).toBeDefined();
            expect(t.getLeaves()[0] instanceof Tests.TestLeaf).toBeTruthy();
            expect(t.getLeaves()[0].getTree() instanceof Tests.TestTree).toBeTruthy();
            done();

        });

    });

    it("can load objects that are embedded deeper in a non entity structure", function (done) {
        var t1:Tests.TestTree = new Tests.TestTree(10);
        var i;
        debugger;
        Promise.all([treeCollection.insert(t1), personCollection.newPerson("norbert")]).then((arr)=>{
            return clientTreeService.aTreeAndAPerson(arr[0],arr[1].getId());
        }).then((arr)=> {
            expect(arr).toBeDefined();
            expect(arr.length).toBe(2);
            var tree = arr[0];
            var person = arr[1];
            expect( tree instanceof Tests.TestTree ).toBeTruthy();
            expect( person instanceof Tests.TestPerson ).toBeTruthy();
            expect( person instanceof Tests.TestPerson ).toBeTruthy();
            var r = tree.grow();
            expect( r.then ).toBeDefined();
            done();
        }).catch(done.fail);
    });

    it("can save objects that have sub objects (in an array) which have a parent reference", function (done) {
        var t1:Tests.TestTree = new Tests.TestTree(10);
        t1.grow();
        var i;
        treeCollection.insert(t1).then((id:string)=>{
            i = id;
            return treeCollection.getById(id);
        }).then((t:Tests.TestTree)=> {
            expect(t).toBeDefined();
            expect(t.getLeaves()[0] instanceof Tests.TestLeaf).toBeTruthy();
            done();
        });
    });

    it("can serialize sub objects", function () {
        var t1:Tests.TestTree = new Tests.TestTree(10);
        t1.grow();
        var doc:any = new reob.Serializer().toDocument( t1 );
        expect(doc.thoseGreenThings).toBeDefined();
        expect(doc.thoseGreenThings.length).toBe(1);
        expect(doc.thoseGreenThings[0] instanceof Tests.TestLeaf).toBeFalsy();
    });

    it("knows typed properties", function () {
        expect(reob.Reflect.getTypedPropertyNames(Tests.TestTree)).toContain('leaves');
    });

    it("uses persistence paths to return undefined for non existent subobjects ", function () {
        var t1:Tests.TestTree = new Tests.TestTree(10);
        var pp:reob.SerializationPath = new reob.SerializationPath( "TestTree", "tree1");
        pp.appendArrayOrMapLookup("leaves", "nonexistentLeaf");
        expect(pp.getSubObject(t1)).toBeUndefined();
    });

    it("uses persistence paths on documents", function () {
        var t1:Tests.TestTree = new Tests.TestTree(10);
        t1.treeId = "tree1";
        t1.grow();
        var doc = new reob.Serializer().toDocument(t1);
        debugger;
        var t2 = new reob.Serializer().toObject(doc, treeCollection, Tests.TestTree, new reob.SerializationPath(treeCollection.getName(), "tree1") );
        var sp = reob.SerializationPath.getObjectContext(t2).serializationPath;
        expect( sp ).toBeDefined();
        expect( sp.toString()).toBe("TheTreeCollection[tree1]");
        expect(reob.SerializationPath.getObjectContext(t2.leaves[0]).serializationPath.toString()).toBe("TheTreeCollection[tree1].leaves|leaf11");
    });


    it("uses persistence paths on documents", function () {
        var t1:Tests.TestTree = new Tests.TestTree(10);
        var i;
        treeCollection.insert(t1).then((id:string)=>{
            i = id;
            return treeCollection.getById(id);
        }).then((t:Tests.TestTree)=> {
            return Promise.cast(t.grow()).then(()=>{return treeCollection.getById(t.treeId)});
        }).then((t:Tests.TestTree)=> {
            var sp = reob.SerializationPath.getObjectContext(t).serializationPath;
            expect( sp ).toBeDefined();
            expect( sp.toString()).toBe("TheTreeCollection["+i+"]");
            expect(reob.SerializationPath.getObjectContext(t1.leaves[0]).serializationPath.toString()).toBe("TheTreeCollection["+i+"].leaves|leaf11");
        });
    });

    it("can call wrapped functions that are not part of a collection", function () {
        var t1:Tests.TestTree = new Tests.TestTree(10);
        t1.grow();
        expect(t1.getLeaves().length).toBe(1);
    });

    it("serializes basic objects", function () {
        var t1:Tests.TestPerson = new Tests.TestPerson("tp1");
        t1.phoneNumber = new Tests.TestPhoneNumber("12345");
        var doc = new reob.Serializer().toDocument(t1);
        expect(doc._id).toBe("tp1");
        expect(doc["phoneNumber"]["pn"]).toBe("12345");
    });

    it("deserializes basic objects", function () {
        var serializer:reob.Serializer = new reob.Serializer();
        var t1:Tests.TestPerson = new Tests.TestPerson("tp1");
        t1.phoneNumber = new Tests.TestPhoneNumber("12345");
        var doc = serializer.toDocument(t1);
        var t1:Tests.TestPerson = serializer.toObject(doc, undefined, Tests.TestPerson);
        expect(t1.getId()).toBe("tp1");
        expect(t1.phoneNumber instanceof Tests.TestPhoneNumber).toBeTruthy();
        expect(t1.phoneNumber.getNumber()).toBe("12345");
    });

    it("deserializes objects that have subobjects", function () {
        var serializer:reob.Serializer = new reob.Serializer();
        var t1:Tests.TestTree = new Tests.TestTree(123);
        t1.treeId = "t1";
        t1.grow();

        var doc = serializer.toDocument(t1);
        var t1:Tests.TestTree = serializer.toObject(doc, undefined, Tests.TestTree);
        expect(t1.treeId).toBe("t1");
        expect(t1.getLeaves()[0] instanceof Tests.TestLeaf).toBeTruthy();
    });

    it("deserializes objects that have document names", function () {
        var serializer:reob.Serializer = new reob.Serializer();
        var t1:Tests.TestTree = new Tests.TestTree(123);
        t1.treeId = "t1";
        t1.grow();
        var doc:any = serializer.toDocument(t1);
        expect(doc.thoseGreenThings[0].greenIndex).toBe(t1.getLeaves()[0].greenNess);
    });

    it("knows types ", function () {
        expect(reob.Reflect.getPropertyClass(Tests.TestPerson, "tree")).toBe(Tests.TestTree);
        expect(reob.Reflect.getPropertyClass(Tests.TestPerson, "leaf")).toBe(Tests.TestLeaf);
    });

    it("knows document names ", function () {
        expect(reob.Reflect.getDocumentPropertyName(Tests.TestLeaf, "greenNess")).toBe("greenIndex");
        expect(reob.Reflect.getObjectPropertyName(Tests.TestLeaf, "greenIndex")).toBe("greenNess");
    });

    it("can call functions that have are also webMethods normally", function (done) {
        Promise.cast( treeCollection.serverFunction("World", new Tests.TestTree(212), 42) ).then((r)=>{
            expect(r).toBe("Hello World!");
            done();
        });
    });

    it("can call functions with undefined parameters", function (done) {
        Promise.cast( clientTreeService.insertTree(undefined) ).then((r)=>{
            done();
        });
    });
    
    it("serializes objects to plain objects", function () {
        var tp = new Tests.TestPerson("tp");
        tp.tree = new Tests.TestTree(12);
        var serializer = new reob.Serializer();
        var doc:any = serializer.toDocument(tp);

        expect(doc.tree instanceof Tests.TestTree).toBeFalsy();
    });
    //
    //
    it("can serialize object in a map", function () {
        var tp = new Tests.TestPerson("tp");
        tp.phoneBook["klaus"] = new Tests.TestPhoneNumber("121212");
        var serializer = new reob.Serializer();
        var doc:any = serializer.toDocument(tp);

        expect(doc).toBeDefined();
        expect(doc.phoneBook).toBeDefined();
        expect(doc.phoneBook["klaus"]).toBeDefined();
        expect(doc.phoneBook["klaus"].pn).toBeDefined();
    });

    it("can serialize object that have a parent object", function () {
        var tp = new Tests.TestTree(23);
        tp.grow();
        var serializer = new reob.Serializer();
        var doc:any = serializer.toDocument(tp);
        var tp2 = serializer.toObject(doc,undefined, Tests.TestTree );
        expect( tp2.getLeaves()[0].parent ).toBeDefined();
        expect( tp2.getLeaves()[0].parent ).toBe( tp2 );
    });

    it("deserializes local objects", function () {
        var car = new Tests.TestCar();
        car.brand = "VW";
        car.wheel = new Tests.TestWheel();
        car.wheel.car = car;
        car.wheel.radius = 10;
        var s:reob.Serializer = new reob.Serializer();
        var document:any = s.toDocument(car);
        var otherCar = s.toObject(document, undefined, Tests.TestCar);
        var doc:any = s.toDocument(otherCar);

        expect(doc).toBeDefined();
        expect(doc.brand).toBe("VW");
        expect(doc.wheel.radius).toBe(10);
        expect(doc instanceof Tests.TestCar).toBeFalsy();
    });
    //
    it("serializes local objects", function () {
        var car = new Tests.TestCar();
        car.brand = "VW";
        car.wheel = new Tests.TestWheel();
        car.wheel.car = car;
        car.wheel.radius = 10;
        var s:reob.Serializer = new reob.Serializer();
        var doc:any = s.toDocument(car);
        var otherCar = s.toObject(doc, undefined, Tests.TestCar);
        expect(otherCar).toBeDefined();
        expect(otherCar.brand).toBe("VW");
        expect(otherCar.wheel.radius).toBe(10);
        expect(otherCar instanceof Tests.TestCar).toBeTruthy();

    });

    it("doesnt serialize ignored properties", function () {
        var car = new Tests.TestCar();
        car.brand = "VW";
        car.temperature = "hot";
        var s:reob.Serializer = new reob.Serializer();
        var doc:any = s.toDocument(car);
        expect(doc.brand).toBe("VW");
        expect(doc.temperature).toBeUndefined();
    });

    it("marks properties as ignored", function () {
        expect(reob.Reflect.isIgnored(Tests.TestCar, "temperature")).toBeTruthy();
    });
    //
    it("deserializes local objects with arrays", function () {
        var car = new Tests.TestCar();
        car.wheels.push(new Tests.TestWheel());
        car.wheels.push(new Tests.TestWheel());
        car.wheels.push(new Tests.TestWheel());
        car.wheels.push(new Tests.TestWheel());
        var s:reob.Serializer = new reob.Serializer();
        var doc:any = s.toDocument(car);
        expect(doc).toBeDefined();
        expect(doc.wheels).toBeDefined();
        expect(doc.wheels.length).toBe(4);
    });
    //
    it("serializes local objects with arrays", function () {
        var s:reob.Serializer = new reob.Serializer();
        var otherCar:Tests.TestCar = s.toObject({
            brand: "Monster",
            wheels: [{}, {}, {}, {radius: 12}]
        }, undefined, Tests.TestCar);
        expect(otherCar).toBeDefined();
        expect(otherCar.brand).toBe("Monster");
        expect(otherCar.wheels[3].radius).toBe(12);
        expect(otherCar.wheels[2].radius).toBeUndefined();
        expect(otherCar.wheels[2] instanceof Tests.TestWheel).toBeTruthy();
        expect(otherCar instanceof Tests.TestCar).toBeTruthy();
    });
    //
    it("properties of child objects have no type on the parent object", function () {
        expect(reob.Reflect.getPropertyClass(Tests.TestInheritanceParent, "childOther")).toBeUndefined();
    });
    //
    it("properties of child objects have a type on the child object", function () {
        expect(reob.Reflect.getPropertyClass(Tests.TestInheritanceChild, "childOther")).toBe(Tests.TestInheritanceOther);
    });
    //
    it("properties of the parent class have a type on the child class", function () {
        expect(reob.Reflect.getPropertyClass(Tests.TestInheritanceChild, "parentOther")).toBe(Tests.TestInheritanceOther);
    });
    //
    it("serializes local objects with inheritance", function () {
        var s:reob.Serializer = new reob.Serializer();
        var child:Tests.TestInheritanceChild = new Tests.TestInheritanceChild();
        child.childOther = new Tests.TestInheritanceOther();
        child.childOther.name = "Otter";
        child.childOther.otherness = 42;
        child.parentOther = new Tests.TestInheritanceOther();
        child.parentOther.name = "Groundhog";
        child.parentOther.otherness = 84;
        var doc = s.toDocument(child);
        var child2 = s.toObject(doc, undefined, Tests.TestInheritanceChild);
        expect(child2.parentOther instanceof Tests.TestInheritanceOther).toBeTruthy();
        expect(!(child2.childOther instanceof Tests.TestInheritanceOther)).toBeFalsy();
        expect(child.getChildThing()).toBe("Otter 42 Groundhog 84");
    });
    //
    it("serializes local parent objects with inheritance", function () {
        var s:reob.Serializer = new reob.Serializer();
        var parent:Tests.TestInheritanceParent = new Tests.TestInheritanceParent();
        parent.parentOther = new Tests.TestInheritanceOther();
        parent.parentOther.name = "Groundhog";
        parent.parentOther.otherness = 84;
        debugger;
        var doc:any = s.toDocument(parent, true);
        console.log(doc);
        var parent2 = s.toObject(doc, undefined, Tests.TestInheritanceParent);
        expect(parent2.parentOther instanceof Tests.TestInheritanceOther).toBeTruthy();
        expect(doc.parentOther instanceof Tests.TestInheritanceOther).toBeFalsy();
    });
    //
    it("ignores properties that need to be ignored on parent properties", function () {
        var s:reob.Serializer = new reob.Serializer();
        var child:Tests.TestInheritanceChild = new Tests.TestInheritanceChild();
        child.ignoredOther = new Tests.TestInheritanceOther();
        child.ignoredOther.name = "I need to be ignored";
        child.parentOther = new Tests.TestInheritanceOther();
        child.parentOther.name = "Groundhog";
        child.parentOther.otherness = 84;
        var doc:any = s.toDocument(child);
        var child2 = s.toObject(doc, undefined, Tests.TestInheritanceChild);
        expect(doc.ignoredOther).toBeUndefined();
        expect(child2.ignoredOther).toBeUndefined();
    });



    it("can do basic inserts", function (done) {
        treeCollection.newTree(20).then((tree:Tests.TestTree)=>{
            expect(tree).toBeDefined();
            expect(tree instanceof Tests.TestTree).toBeTruthy();
            expect(tree.treeId).toBeDefined();
            expect(tree.getHeight()).toBe(20);
            return treeCollection.getById(tree.treeId);
        }).then(( tree:Tests.TestTree )=>{
            expect(tree).toBeDefined();
            expect(tree.treeId).toBeDefined();
            expect(tree.getHeight()).toBe(20);
            done();
        }).catch((ee)=>{
            fail(ee);
            done();
        });
    });


    it("updates the collection", function (done) {
        var id;
        personCollection.newPerson('bert').then((e:Tests.TestPerson)=> {
            id = e.getId();
            return e.collectionUpdateRename("klaus");
        }).then( (n:string)=>{
            return personCollection.getById(id);
        }).then((p:Tests.TestPerson)=>{
            expect(p.getName()).toBe("Collection Update:klaus");
            done();
        }).catch((e)=>{
            fail(e);
            done();
        });
    });


    it("can save foreign keys in a map", function (done) {
        var personPromise = personCollection.newPerson("Held");
        var tree1Promise = treeCollection.newTree(13);
        var tree2Promise = treeCollection.newTree(12);
        Promise.all( [tree1Promise,tree2Promise,personPromise] ).then((values:any)=>{
            var t1 = values[0];
            var t2 = values[1];
            var held = values[2];
            var ap1 = (<any>held.addToWood(t1, "peterKey")).then((r)=>{
                return r;
            });
            var ap2 = (<any>held.addToWood(t2, "klausKey")).then((r)=>{
                return r;
            });
            return Promise.all([ap1,ap2]);
        }).then((arr:any)=>{
            return Promise.all([personPromise.then((held:Tests.TestPerson)=>{
                return personCollection.getById(held.getId());
            }), tree1Promise]);
        }).then((arr)=>{
            var held:Tests.TestPerson = arr[0];
            var peter = arr[1];
            expect(held).toBeDefined();
            // expect(omm.Serializer.needsLazyLoading(held, "wood")).toBeTruthy();
            expect(held.wood).toBeDefined();
            // expect(omm.Serializer.needsLazyLoading(held, "wood")).toBeFalsy();
            expect(typeof held.wood).toBe("object");
            expect(held.wood["peterKey"]).toBeDefined();
            expect(held.wood["peterKey"] instanceof Tests.TestTree).toBeTruthy();
            // expect(held.wood["peterKey"].treeId).toBe(peter.treeId);
            done();
        });
    });



    it("can do basic removes", function (done) {
        var treeId;
        treeCollection.newTree(20).then( ( t:Tests.TestTree) => {
            treeId = t.treeId;
        }).then(()=>{
            return treeCollection.getById(treeId);
        }).then(( t:Tests.TestTree )=>{
            expect( t ).toBeDefined();
            return treeCollection.deleteTree(treeId);
        }).then(()=>{
            return treeCollection.getByIdOrFail(treeId).then((t)=>{
                fail("tree was still there" );
                done();
            }).catch((reason)=>{
                done();
            });
        }).catch((reason)=>{
            fail(reason);
            done();
        });
    });

    it("removes all", function () {
        // this test tests the before all thing
        expect(true).toBeTruthy();
    });

    it("deserializes objects of different classes in an array", function () {
        var s:reob.Serializer = new reob.Serializer();
        var person:Tests.TestPerson = new Tests.TestPerson('p1', 'pete');
        var child:Tests.TestInheritanceChild = new Tests.TestInheritanceChild();
        var wheel:Tests.TestWheel = new Tests.TestWheel();
        var car:Tests.TestCar = new Tests.TestCar();
        person.addresses.push(<any>child);
        person.addresses.push(<any>wheel);
        person.addresses.push(<any>car);
        var doc:any = s.toDocument(person, true);
        var person2 = s.toObject(doc, undefined, Tests.TestPerson);
        console.log(doc);
        expect(person2.addresses[0] instanceof Tests.TestInheritanceChild).toBeTruthy();
        expect(person2.addresses[1] instanceof Tests.TestWheel).toBeTruthy();
        expect(person2.addresses[2] instanceof Tests.TestCar).toBeTruthy();
    });


    it("can get the testwheel class by its configured name", function () {
        var p = reob.Reflect.getEntityClassByName("TestWheelBanzai")
        expect(p).toBeDefined();
        expect(p).toBe(Tests.TestWheel);
    });

    it("can get the testCar class by its name", function () {
        var p = reob.Reflect.getEntityClassByName("TestCar");
        expect(p).toBeDefined();
        expect(p).toBe(Tests.TestCar);
    });

    it("verifies that updates fail if the id is not given ", function (done) {
        personCollection.update(undefined, function () {
        }).then(()=>{
            fail("did succeed");
            done();
        }).catch(()=>{
            done();
        });
    });


    it("can handle thrown errors", function (done) {
        treeCollection.newTree(10).then((tree:Tests.TestTree)=>{
            return tree.thisThrowsAnError();
        }).catch((err)=>{
                expect(err).toBeDefined();
                expect(err instanceof Error).toBeTruthy();
                done();
        });
    });

    it("trees have leaves", function (done) {
        var tId;
        treeCollection.newTree(10).then((t)=> {
            tId = t.treeId;
            expect(t).toBeDefined();
            return t.grow();
        }).then((values)=> {
            return treeCollection.getById(tId);
        }).then((t)=> {
            expect(t.getLeaves()[0]).toBeDefined();
            done();
        });
    });

    it("can load trees ", function (done) {
        treeCollection.newTree(20)
            .then((tree:Tests.TestTree)=>{
                console.log("Tree id", tree.treeId);
                return client.load( "TheTreeCollection", tree.treeId );
            })
            .then((tree:Tests.TestTree)=>{
                expect( tree ).toBeDefined();
                expect( tree instanceof Tests.TestTree ).toBeTruthy();
                done();
            });
    });

    it("can load trees and call stuff on it", function (done) {
        var treeId;
        treeCollection.newTree(20)
            .then((tree:Tests.TestTree)=>{
                console.log("Tree id", tree.treeId);
                treeId = tree.treeId;
                expect( tree.getHeight() ).toBe(20);
                return client.load( "TheTreeCollection", tree.treeId );
            })
            .then((tree:Tests.TestTree)=>{
                expect( tree ).toBeDefined();
                expect( tree.getHeight() ).toBe(20);
                var growPromise = tree.grow();
                return growPromise;
            })
            .then((s:string)=>{
                return client.load( "TheTreeCollection", treeId );
            })
            .then((tree:Tests.TestTree)=>{
                expect( tree.getHeight() ).toBe(21);
                done();
            });
    });


    it("doesnt reuse arrays in documents", function () {
        var tree = new Tests.TestTree(12);
        var serializer = new reob.Serializer();
        debugger;
        var doc:any = serializer.toDocument(tree);
        expect(  tree.someArray.length ).toBe(0);
        expect(  doc.someArray ).toBeDefined();
        expect( tree.someArray ).not.toBe(doc.someArray );
        tree.someArray.push(42);
        expect( doc.someArray.length ).toBe(0);
        var t2 = serializer.toObject(doc, undefined, Tests.TestTree);
        expect( t2.someArray ).not.toBe(doc.someArray );
        doc.someArray.push(1200);
        expect( t2.someArray.length ).toBe(0);
    });

    it("can serialize primitive data types", function () {
        var serializer = new reob.Serializer();
        var obj = serializer.toObject([42]);
        expect( Array.isArray(obj) ).toBeTruthy();
        expect( obj.length ).toBe(1);
        expect( obj[0] ).toBe(42);
        var doc:any = serializer.toDocument([42]);
        expect( Array.isArray(doc) ).toBeTruthy();
        expect( doc.length ).toBe(1);
        expect( doc[0] ).toBe(42);
    });




    it("returns the proper error", function (done) {
        treeCollection.getByIdOrFail('humbug').catch((reason)=>{
            expect( reason ).toBeDefined();
            expect( reason.message ).toBe("Not found");
            expect( reason instanceof Error ).toBeTruthy();
            done();
        })
    });

    it("does not transmit properties that are private to the server", function () {
        expect( reob.Reflect.isPrivateToServer( Tests.TestCar, "privateToServer" ) ).toBeTruthy();
    });


    it("uses promises while loading", function (done) {
        var c =new Tests.TestCar();
        c.brand = "bmw";
        var i;
        carCollection.insert(c).then((id)=>{
            i = id;
            return client.load(carCollection.getName(), id)
        }).then((c:Tests.TestCar)=>{
            fail("Loading allowed");
            done();
        }).catch((reason:Error)=>{
            expect(reason.message).toBe("nay");
            client.setUserData({userId:"bert"});
            client.load(carCollection.getName(), i).then((c2:Tests.TestCar)=>{
                expect(c2.brand).toBe("bmw");
                done();
            }).catch((r)=>{
                fail(r);
                done();
            });
        })
    });

    it("the correct session factory in methods", function (done) {
        var isInstance:boolean = false;
        var listener:reob.MethodEventListener = ( object:any, functionName:string, args:any[], request:reob.Request, result?:any)=>{
            isInstance = request instanceof  Tests.TestRequest;
        };
        var l = {listener:listener };
        spyOn(l, "listener").and.callThrough();
        var t1:Tests.TestTree = new Tests.TestTree(15);
        server.onBeforeMethod(l.listener);
        treeCollection.insert(t1).then( (id:string)=> {
            return clientTreeService.growTree( id ).thenReturn( id );
        }).then((id)=>{
            expect( l.listener ).toHaveBeenCalled();
            expect( isInstance ).toBeFalsy();
            server.setRequestFactory((ud:any)=>{
                return new Tests.TestRequest( ud );
            });
            return id;
        }).then( (id:string)=> {
            return clientTreeService.growTree( id );
        }).then((id)=>{
            expect( l.listener ).toHaveBeenCalled();
            expect( isInstance ).toBeTruthy();
            done()
        }).catch((r)=>{
            fail(r);
            done()
        });
    });




    //// -------------------------------------------------------
    //// ------------------------ events -----------------------
    //// -------------------------------------------------------

    //// ------------------------ events : insert -----------------------

    it( "can register to before insert events", function (done) {
        var l = spyOnAndCallThrough<reob.InsertEventListener<Tests.TestTree>>( (object:Tests.TestTree, request:reob.Request )=>{
            expect( object instanceof Tests.TestTree ).toBeTruthy();
            expect( object?object.getHeight():undefined ).toBe(5);
            expect( object?object.treeId:undefined ).toBeDefined();
            expect( request ).toBeDefined();
            expect(request?request.userData:undefined).toBeDefined();
            expect(request && request.userData ?request.userData.Hello:undefined).toBe(41);

            // verify that the object was not yet inserted
            return treeCollection.getById(object.treeId).then((t)=>{
                expect(t).toBeUndefined();
            });
        });
        treeCollection.onBeforeInsert(l);
        client.setUserData({Hello:41});
        clientTreeService.insertTree(5).then(()=>{
            expect(l).toHaveBeenCalledTimes(1);
            done();
        }).catch(done.fail);
    });

    it("can cancel inserts", function (done) {
        var id:string;
        var l = spyOnAndCallThrough<reob.InsertEventListener<Tests.TestTree>>( (object:Tests.TestTree, request:reob.Request )=>{
            id = object.treeId;
            throw new Error("Not happening");
        });
        treeCollection.onBeforeInsert(l);
        clientTreeService.insertTree(5).then(()=>{
            done.fail("ended up in then part")
        }).catch((reason)=>{
            expect(reason?reason.message:undefined).toBe("Not happening");

            treeCollection.getById(id).then((t)=>{
                expect(t).toBeUndefined();
                done();
            })
        });
    });


    it( "can register to after insert events", function (done) {
        var l = spyOnAndCallThrough<reob.InsertEventListener<Tests.TestTree>>( (object:Tests.TestTree, request:reob.Request )=>{
            expect( object instanceof Tests.TestTree ).toBeTruthy();
            expect( object?object.getHeight():undefined ).toBe(5);
            expect( object?object.treeId:undefined ).toBeDefined();
            expect( request ).toBeDefined();
            expect(request?request.userData:undefined).toBeDefined();
            expect(request && request.userData ?request.userData.Hello:undefined).toBe(41);

            // verify that the object was not yet inserted
            return treeCollection.getById(object.treeId).then((t)=>{
                expect(t).toBeDefined();
            });
        });
        treeCollection.onAfterInsert(l);
        client.setUserData({Hello:41});
        clientTreeService.insertTree(5).then(()=>{
            expect(l).toHaveBeenCalledTimes(1);
            done();
        }).catch(done.fail);
    });

    //// ------------------------ events : remove -----------------------

    it("can register to before remove events", function (done) {
        var l = spyOnAndCallThrough<reob.RemoveEventListener>( (id:string, request:reob.Request )=>{
            expect( id ).toBeDefined();
            expect( request ).toBeDefined();
            expect(request?request.userData:undefined).toBeDefined();
            expect(request && request.userData ?request.userData.Hello:undefined).toBe(41);

            // verify that the object was not yet inserted
            return treeCollection.getById(id).then((t)=>{
                expect(t).toBeDefined();
            });
        });
        treeCollection.onBeforeRemove(l);

        client.setUserData({Hello:41});

        treeCollection.newTree(10).then((tree)=> {

            return clientTreeService.removeTree(tree.treeId);
        }).then(()=>{
            expect(l).toHaveBeenCalledTimes(1);
            done();
        });
    });


    it("can cancel removes", function (done) {
        var id:string;
        var l = spyOnAndCallThrough<reob.RemoveEventListener>( (id:string, request:reob.Request )=>{
            throw new Error("non");
        });
        treeCollection.onBeforeRemove(l);
        treeCollection.newTree(10).then((tree)=> {
            id = tree.treeId;
            return clientTreeService.removeTree(id);
        }).then(()=>{
            done.fail("then part");
        }).catch(r =>{
            expect(l).toHaveBeenCalledTimes(1);
            expect( r?r.message:undefined ).toBe("non");
            treeCollection.getByIdOrFail(id).then(done).catch(done.fail);
        });
    });

    it("can register to after remove events", function (done) {
        var l = spyOnAndCallThrough<reob.RemoveEventListener>( (id:string, request:reob.Request )=>{
            expect( id ).toBeDefined();
            expect( request ).toBeDefined();
            expect( request?request.userData:undefined).toBeDefined();
            expect( request && request.userData ?request.userData.Hello:undefined).toBe(41);

            // verify that the object was not yet inserted
            return treeCollection.getByIdOrFail(id).then( t => fail("not deleted") ).catch(()=>{});
        });
        treeCollection.onAfterRemove(l);

        client.setUserData({Hello:41});

        treeCollection.newTree(10).then((tree)=> {

            return clientTreeService.removeTree(tree.treeId);
        }).then(()=>{
            expect(l).toHaveBeenCalledTimes(1);
            done();
        });
    });

    //// ------------------------ events : update -----------------------

    fit("can register for before update events and the event listener receives all the correct data.", function (done) {
        var l = spyOnAndCallThrough<reob.UpdateEventListener<Tests.TestTree>>( ( updateEvent:reob.UpdateEvent<Tests.TestTree> )=>{
            expect(updateEvent).toBeDefined();
            if( updateEvent ) {
                expect( updateEvent.rootObject).toBeDefined();
                expect( updateEvent.rootObject instanceof Tests.TestTree).toBeTruthy();
                expect( updateEvent.functionName).toBe("setSomeBooleanTo");
                expect( updateEvent.args).toEqual([true]);
                expect( updateEvent.request).toBeDefined();

                expect( updateEvent.beforeUpdateDocument ).toBeDefined();
                if( updateEvent.beforeUpdateDocument ) expect( updateEvent.beforeUpdateDocument["someBoolean"]).toBe(false);

                expect( updateEvent.afterUpdateDocument ).toBeUndefined();
                expect( updateEvent.result ).toBeUndefined();
                // if( updateEvent.afterUpdateDocument ) expect( updateEvent.afterUpdateDocument["someBoolean"]).toBe(true);

                expect( updateEvent.request ).toBeDefined();
                expect( updateEvent.request?updateEvent.request.userData:undefined).toBeDefined();
                expect( updateEvent.request && updateEvent.request.userData ?updateEvent.request.userData.Hello:undefined).toBe(41);
            }
        });
        treeCollection.onBeforeUpdate( l );
        client.setUserData({Hello:41});
        treeCollection.newTree(10).then((tree)=>{
            return clientTreeService.setSomeBooleanOnTree(tree.treeId, true);
        }).then( (s)=>{
            expect(l).toHaveBeenCalled();
            done();
        });
    });

    fit("can register to after-update-events and the event listener receives all the correct data.", function (done) {
        var l = spyOnAndCallThrough<reob.UpdateEventListener<Tests.TestTree>>( ( updateEvent:reob.UpdateEvent<Tests.TestTree> )=>{
            expect(updateEvent).toBeDefined();
            if( updateEvent ) {
                expect( updateEvent.rootObject).toBeDefined();
                expect( updateEvent.rootObject instanceof Tests.TestTree).toBeTruthy();
                expect( updateEvent.functionName).toBe("setSomeBooleanTo");
                expect( updateEvent.args).toEqual([true]);
                expect( updateEvent.request).toBeDefined();

                expect( updateEvent.beforeUpdateDocument ).toBeDefined();
                if( updateEvent.beforeUpdateDocument ) expect( updateEvent.beforeUpdateDocument["someBoolean"]).toBe(false);

                expect( updateEvent.result ).toBe("set to true");
                expect( updateEvent.afterUpdateDocument ).toBeDefined();
                if( updateEvent.afterUpdateDocument ) expect( updateEvent.afterUpdateDocument["someBoolean"]).toBe(true);

                expect( updateEvent.request ).toBeDefined();
                expect( updateEvent.request?updateEvent.request.userData:undefined).toBeDefined();
                expect( updateEvent.request && updateEvent.request.userData ?updateEvent.request.userData.Hello:undefined).toBe(41);
            }
        });
        treeCollection.onAfterUpdate( l );
        client.setUserData({Hello:41});
        treeCollection.newTree(10).then((tree)=>{
            return clientTreeService.setSomeBooleanOnTree(tree.treeId, true);
        }).then( (s)=>{
            expect(l).toHaveBeenCalled();
            done();
        });
    });

    fit("can register to all update listeners and they are called in the correct order", function (done) {
        var c = 0;
        var lBefore = spyOnAndCallThrough<reob.UpdateEventListener<Tests.TestTree>>( ( updateEvent:reob.UpdateEvent<Tests.TestTree> )=>{
            expect( c ).toBe(0);
            c++;
        });
        var lSave = spyOnAndCallThrough<reob.SaveEventListener<Tests.TestTree>>( ( t:Tests.TestTree )=>{
            expect( c ).toBe(1);
            c++;

        });
        var lDuring = spyOnAndCallThrough<reob.UpdateEventListener<Tests.TestTree>>( ( updateEvent:reob.UpdateEvent<Tests.TestTree> )=>{
            expect( c ).toBe(2);
            c++;
        });
        var lAfter = spyOnAndCallThrough<reob.UpdateEventListener<Tests.TestTree>>( ( updateEvent:reob.UpdateEvent<Tests.TestTree> )=>{
            expect( c ).toBe(3);
            c++;
        });
        treeCollection.onBeforeUpdate( lBefore );
        treeCollection.onBeforeSave( lSave );
        treeCollection.onDuringUpdate( lDuring );
        treeCollection.onAfterUpdate( lAfter );

        treeCollection.newTree(10).then((tree)=>{
            return tree.setSomeBooleanTo(false);
        }).then( (s)=>{
            expect(lBefore).toHaveBeenCalledTimes(1);
            expect(lSave).toHaveBeenCalledTimes(1);
            expect(lDuring).toHaveBeenCalledTimes(1);
            expect(lAfter).toHaveBeenCalledTimes(1);
            done();
        });
    });

    it("can receive emitted events from a subobject", function (done) {
        var l =  spyOnAndCallThrough( (event:reob.UpdateEvent<Tests.TestTree>)=>{} );
        treeCollection.onDuringUpdate( "fluttering", l );
        var tId;
        treeCollection.newTree(10).then((t)=> {
            expect(t).toBeDefined();
            tId = t.treeId;
            return t.grow();
        }).then((values)=> {
            return treeCollection.getById(tId);
        }).then((t)=> {
            expect(l).not.toHaveBeenCalled();
            return t.getLeaves()[0].flutter();
        }).then(()=>{
            expect(l).toHaveBeenCalled();
            done();
        });
    });





    it("can receive emitted events from a subobject even if another (the first) event listener throws an exception", function (done) {
        // var l:any = {};
        // l.listener1 = function (event:reob.EventContext<Tests.TestTree>) {
        //     // throw "freekish error";
        // };
        // l.listener2 = function (event:reob.EventContext<Tests.TestTree>) {
        //
        // };
        // spyOn(l, 'listener1').and.callThrough();
        // spyOn(l, 'listener2').and.callThrough();
        //
        // treeCollection.onDuringUpdate( "fluttering", l.listener1 );
        // treeCollection.onDuringUpdate( "fluttering", l.listener2 );
        //
        // var treePromise = treeCollection.newTree(10);
        // var treeIdPromise = treePromise.then((t)=>{
        //     return t.treeId;
        // });
        // var growPromise = treePromise.then((t)=>{
        //     return t.grow();
        // });
        //
        // var treePromise2 = Promise.all([growPromise, treeIdPromise]).then((values:any)=>{
        //     var treeId = values[1];
        //     return treeCollection.getById(treeId);
        // });
        //
        // var flutterPromise = treePromise2.then((t)=>{
        //     return t.getLeaves()[0].flutter();
        // }).then((t)=>{
        //     expect(l.listener1).toHaveBeenCalled();
        //     expect(l.listener2).toHaveBeenCalled();
        //     done();
        // }).catch((e)=>{
        //     fail(e);
        //     done();
        // });
        done.fail("it needs to be implemented");
    });
    //
    //

    // it("can receive emitted events from a subobject and get the object", function (done) {
    //     var l:any = {};
    //     l.listener = function (event:omm.EventContext<Tests.TestTree>) {
    //         expect(event.object instanceof Tests.TestLeaf).toBeTruthy();
    //     };
    //     spyOn(l, 'listener').and.callThrough();
    //     omm.on(Tests.TestLeaf, "fluttering", l.listener);
    //     co( function* (){
    //         treeCollection.newTree(10, function (err, t:Tests.TestTree) {
    //             expect(err).toBeUndefined();
    //             t.grow();
    //             t = treeCollection.getById(t.treeId);
    //             expect(l.listener).not.toHaveBeenCalled();
    //             t.getLeaves()[0].flutter();
    //             expect(l.listener).toHaveBeenCalled();
    //             done()
    //         });
    //
    //     });
    // });


    it("can receive emitted events from a subobject and get the root object", function (done) {
        // var l:any = {};
        // l.listener = function (event:reob.EventContext<Tests.TestTree>) {
        //     expect(event.rootObject instanceof Tests.TestTree).toBeTruthy();
        // };
        // spyOn(l, 'listener').and.callThrough();
        //
        // treeCollection.onDuringUpdate( "fluttering", l.listener );
        //
        // treeCollection.newTree(10).then((t)=> {
        //     return Promise.cast(t.grow()).thenReturn(t);
        // }).then((tree)=>{
        //     return treeCollection.getById(tree.treeId);
        // }).then((tree2)=> {
        //     expect(l.listener).not.toHaveBeenCalled();
        //     return tree2.getLeaves()[0].flutter();
        // }).then(()=>{
        //     expect(l.listener).toHaveBeenCalled();
        //     done()
        // });
        done.fail("it needs to be implemented");
    });

    it("can return errors in a promise ", function (done) {
        treeCollection.errorMethod(10).then(()=>{
            done.fail(new Error("still happened"));
        }).catch((err)=>{
            expect(err).toBe("the error");
            done();
        });
    });

    //
    it("can cancel updates on a subobject in a generic listener", function (done) {
        // var l:any = {};
        // l.listener = function (event:reob.EventContext<Tests.TestTree>) {
        //     event.cancel(new Error("not happening"));
        // };
        // spyOn(l, 'listener').and.callThrough();
        // treeCollection.onBeforeUpdate( l.listener );
        //
        // treeCollection.newTree(10).then((tree)=>{
        //     return tree.grow();
        // }).catch( (reason)=>{
        //     expect(reason.message).toBe("not happening");
        //     expect(l.listener).toHaveBeenCalled();
        //     done();
        // });
        done.fail("it needs to be implemented");
    });

    it("can cancel updates on a subobject in a generic listener on a subobject", function (done) {
        // var l:any = {};
        // l.listener = function (event:reob.EventContext<Tests.TestTree>) {
        //     event.cancel(new Error("not happening either"));
        // };
        // spyOn(l, 'listener').and.callThrough();
        // treeCollection.onBeforeUpdate( l.listener );
        // var treePromise = treeCollection.newTree(10);
        // treePromise.then((tree)=> {
        //     return Promise.all([tree.grow(), treePromise]);
        // }).then((values:any)=>{
        //     return treeCollection.getById(values[1].treeId);
        // }).then((tree)=>{
        //     return tree.getLeaves()[0].flutter()
        // }).catch( (err)=>{
        //     expect(err.message).toBe("not happening either");
        //     expect(l.listener).toHaveBeenCalled();
        //     done();
        // });
        done.fail("it needs to be implemented");
    });

    function pit(s:string, f:Function ){
        it( s, function(done){
            var promise = f();
            promise.then(()=>{
                done();
            }).catch((err)=>{
                fail(err);
                done();
            })
        });
    }

    pit("can register for post update events", function (done) {
        var l:any = {};
        l.listener = (id:string, rootObject:Tests.TestTree, subObject:reob.Object, functionName:string, args:any[], request?:reob.Request, result?:any) => {
            expect( rootObject ).toBeDefined();
            expect( subObject ).toBeDefined();
            expect( rootObject instanceof Tests.TestTree).toBeTruthy();
            expect(rootObject.getLeaves().length + 1000).toBe(1001); //
        };
        spyOn(l, 'listener').and.callThrough();
        treeCollection.onAfterUpdate( l.listener );

        var treePromise = treeCollection.newTree(10);
        return treePromise.then((tree)=> {
            return Promise.all([tree.grow(), treePromise]);
        }).then((values:any)=>{
            return treeCollection.getById(values[1].treeId);
        }).then((tree)=>{
            expect(l.listener).toHaveBeenCalled();
            expect(tree.getLeaves().length).toBe(1);
        });
    });

    it("can cancel updates", function (done) {
        // var l:any = {};
        // l.listener = function (event:reob.EventContext<Tests.TestTree>) {
        //     event.cancel(new Error( "nope" ));
        // };
        // spyOn(l, 'listener').and.callThrough();
        // treeCollection.onBeforeUpdate( l.listener );
        //
        // var treeId;
        // var treePromise = treeCollection.newTree(10);
        // return treePromise.then((tree)=> {
        //     treeId  = tree.treeId;
        //     return Promise.all([tree.grow(), treePromise]);
        // }).catch((err)=>{
        //     expect(err.message).toBe("nope");
        //     treeCollection.getById(treeId).then((nt)=>{
        //         expect(nt.getLeaves().length).toBe(0);
        //         done();
        //
        //     });
        // });
        done.fail("it needs to be implemented");

    });

    it("can register to update events", function (done) {
        // var l:any = {};
        // var n:Array<string> = [];
        // l.listener = function (event:reob.EventContext<Tests.TestTree>, data:any) {
        //     n.push(data);
        // };
        // spyOn(l, 'listener').and.callThrough();
        //
        // treeCollection.onDuringUpdate("gardenevents", l.listener)
        // var treePromise = treeCollection.newTree(10);
        // return treePromise.then((tree)=> {
        //     return Promise.all([tree.wither(), treePromise]);
        // }).then((values:any)=>{
        //     return treeCollection.getById(values[1].treeId);
        // }).then((tree)=>{
        //     expect(l.listener).toHaveBeenCalled();
        //     expect(n).toContain("withered");
        //     expect(n).toContain("withered2");
        //     done();
        // });
        done.fail("it needs to be implemented");
    });

    it("can register to all update events", function (done) {
        // var l:any = {};
        // var n:Array<string> = [];
        // l.listener = function (event:reob.EventContext<Tests.TestTree>, data:any) {
        //     n.push(data);
        // };
        // spyOn(l, 'listener').and.callThrough();
        //
        // treeCollection.onBeforeSave(l.listener);
        // treeCollection.newTree(10).then((t)=>{
        //     return t.wither();
        // }).then(()=>{
        //     expect(l.listener).toHaveBeenCalled();
        //     done();
        //
        // });
        done.fail("it needs to be implemented");
    });
    



    it("transports the request when updating", function (done) {
        // var l:any = {};
        // var n:Array<string> = [];
        // client.setUserData({user:"bert", foo:"bar", solution:42});
        // l.listener = function (ctx:reob.EventContext<Tests.TestTree>, data:any) {
        //     expect( ctx.request ).toBeDefined();
        //     expect( ctx.request.userData ).toBeDefined();
        //     expect( ctx.request.userData.user ).toBe( "bert" );
        //     expect( ctx.request.userData.solution ).toBe( 42 );
        // };
        // spyOn(l, 'listener').and.callThrough();
        //
        // treeCollection.onBeforeUpdate(l.listener);
        // clientTreeService.insertTree(5).then((t:Tests.TestTree)=>{
        //     return t.grow();
        // }).then(()=>{
        //     expect( l.listener ).toHaveBeenCalled();
        // }).then(done);
        done.fail("it needs to be implemented");
    });


    it("transports function names and objects when updating", function (done) {
        var l:any = {};
        var n:Array<string> = [];
        client.setUserData({user:"bert", foo:"bar", solution:42});
        l.listener = function ( rootObject:Tests.TestTree, subObject:reob.Object, functionName:string, args:any[], request?:reob.Request, result?:any ) {
            expect( functionName ).toBe('flutter');
            expect( subObject instanceof Tests.TestLeaf ).toBeTruthy( );
        };
        spyOn(l, 'listener').and.callThrough();

        var treeId;
        debugger;
        clientTreeService.insertTree(5).then((t:Tests.TestTree)=>{
            treeId = t.treeId;
            return t.grow();
        }).then(()=>{
            return client.load("TheTreeCollection",treeId);
        }).then((t:Tests.TestTree)=>{
            treeCollection.onBeforeUpdate(l.listener);
            return  t.getLeaves()[0].flutter() ;
        }).then(()=>{
            expect( l.listener ).toHaveBeenCalled();
        }).then(done).catch((reason)=>{
            fail(reason);
            done();
        });
    });

    it("can register for update events triggered by a function", function (done) {
        var l:any = {};
        l.listener =  (id:string, rootObject: Tests.TestTree, subObject:reob.Object, functionName:string, args:any[], request?:reob.Request, result?:any) => {
        };
        spyOn(l, 'listener').and.callThrough();
        treeCollection.onBeforeUpdate( Tests.TestTree, "grow", l.listener );
        var treePromise = treeCollection.newTree(10);
        treePromise.then((tree)=>{
            return Promise.all( [tree.grow(), treePromise] );
        }).then( (values)=>{
            expect(l.listener).not.toHaveBeenCalled();
            done();
        });
    });

    it("can not register for update events with a function name that is not a collection update function", function (done) {
        expect(()=>{
            treeCollection.onBeforeUpdate( Tests.TestTree, "notAnUpdateFunction123", ()=>{
            } );
        }).toThrow();
        done();
    });

    it("notifies method listener", function (done) {
        var c = 0;
        var listener:reob.MethodEventListener = (object:any, functionName:string, args:any[], request:reob.Request, result?:any)=>{
            c = 1;
            expect( object instanceof Tests.TreeServiceServer).toBeTruthy();
            expect( request.userData.foo ).toBe("barbar");
        };
        var l = {listener:listener };
        spyOn(l, "listener").and.callThrough();
        var t1:Tests.TestTree = new Tests.TestTree(15);

        server.onBeforeMethod(l.listener);
        client.setUserData({foo:"barbar"});
        treeCollection.insert(t1).then( (id:string)=> {
            return clientTreeService.growTree( id ).thenReturn( id );
        }).then((id)=>{
            return treeCollection.getByIdOrFail(id);
        }).then((t)=>{
            expect( l.listener ).toHaveBeenCalled();
            expect( c ).toBe(1);
            done();
        });
    });

    it("notifies method listener and listeners can cancel the method", function (done) {
        var c = 0;
        var listener:reob.MethodEventListener = (object:any, functionName:string, args:any[], request:reob.Request, result?:any)=>{
            c = 1;
            return Promise.reject( new Error("No") );
        };
        var l = {listener:listener };
        spyOn(l, "listener").and.callThrough();
        var t1:Tests.TestTree = new Tests.TestTree(15);

        server.onBeforeMethod(l.listener);
        client.setUserData({foo:"barbar"});
        treeCollection.insert(t1).then( (id:string)=> {
            return clientTreeService.growTree( id ).thenReturn( id );
        }).then((id)=>{
            return treeCollection.getByIdOrFail(id);
        }).then((t)=>{
            fail("Did succeed desipte being cancelled");
            done();
        }).catch((reason)=>{
            expect(reason.message).toBe("No");
            done();
        });
    });



    it("eventlisteners return a promise", function (done) {
        var l:any = {};
        var n:Array<string> = [];
        client.setUserData({user:"bert", foo:"bar", solution:42});
        l.listener = function ( rootObject:Tests.TestTree, subObject:reob.Object, functionName:string, args:any[], request?:reob.Request, result?:any ) {
            expect( functionName ).toBe('flutter');
            expect( subObject instanceof Tests.TestLeaf ).toBeTruthy( );
        };
        spyOn(l, 'listener').and.callThrough();

        var treeId;
        clientTreeService.insertTree(5).then((t:Tests.TestTree)=>{
            treeId = t.treeId;
            return t.grow();
        }).then(()=>{
            return client.load("TheTreeCollection",treeId);
        }).then((t:Tests.TestTree)=>{
            treeCollection.onBeforeUpdate(l.listener);
            debugger;
            return  t.getLeaves()[0].flutter() ;
        }).then(()=>{
            expect( l.listener ).toHaveBeenCalled();
        }).then(done);
    });

    it("event listeners can throw an Error to abort the operation", function (done) {
        fail("to be implemented")
    });

    // test that calls a nested collection update (one in the other)

    // test that verifies that when en event cancells an operation with ctx.cancell(asdfasdf) its an instanceof Error that rejects the promise.

    // test that makes sure that if a collection updating function throws an exception, stuff still works and event emitters are called properly

    // test that verifies that an onMEthod listener receives the arguments of the method

    // write test that allows for methods to have a given name
});
