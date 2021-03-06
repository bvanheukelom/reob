/**
 * Created by bert on 23.03.16.
 */
import * as reob from "../src/serverModule"

import * as Tests from "./classes/Tests"

var co = require("co");

import "./classes/TestLeaf"

jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000000;
jasmine.getEnv().addReporter({
    specDone: function(result) {
        console.log("Test done:",  result.fullName);
    },

    specStarted: function(result) {
        console.log('------------------------------------------------------------------------');
        console.log("Test started:",  result.fullName);
    }
});


function spyOnAndCallThrough<FKT extends Function>( f:FKT ):FKT{
    var l = {listener:f};
    spyOn(l, "listener").and.callThrough();
    return <any>l.listener;
}

describe("Reob", function () {
    it("can start and stop a server", function (done) {
        var server:reob.Server = new reob.Server("mongodb://localhost/test");
        server.start(12345).then(()=>{
            server.stop();
            return server.start(12345).then(()=>{
                server.stop();
                done();
            });
        }).catch(done.fail)
    });
});

let personCollection:Tests.TestPersonCollection;
let treeCollection:Tests.TestTreeCollection;
let clientTreeService:Tests.TreeService;
let carCollection:Tests.TestCarCollection;
let server:reob.Server;
let client:reob.Client;


describe("Reob", function () {


    beforeAll((done)=>{

        server = new reob.Server("mongodb://localhost/test");

        personCollection = new Tests.TestPersonCollection();
        server.addCollection(personCollection);

        carCollection = new Tests.TestCarCollection();
        server.addCollection(carCollection);
        server.setLoadingAllowed(carCollection,  async (id:string, session:reob.Request, car:Tests.TestCar)=>{
            console.log('checking whether a car can be loaded', car, session);
            expect( car ).toBeDefined();
            expect( car.brand ).toBe("bmw");
            if( !session.userData || session.userData.userId!='bert')
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

    async function removeAll( collection:reob.Collection<any> ):Promise<void>{
        var objects = await collection.getAll();

        const promises = objects.map( o => {
            return collection.remove(reob.getId(o));
        });
        await Promise.all(promises);
    }

    var count =0;
    beforeEach((done)=>{
        count++;
        server.setRequestFactory(undefined);

        console.log("-------"+(count));
        personCollection.removeAllListeners();
        treeCollection.removeAllListeners();
        server.removeAllMethodListeners();
        removeAll(personCollection).then(()=>{
            return removeAll(treeCollection);
        }).then(()=>{
            return removeAll(carCollection);
        }).then(done).catch(done.fail);
    });

    it("knows method annotations ", function () {
        var methodNames = reob.getRemoteFunctionNames(Tests.TestPerson);
        expect(methodNames).toContain("addAddress");
        expect(methodNames.length).toBeGreaterThan(0);
    });

    it("knows the name of collections", function () {
        expect(personCollection.getName()).toBe("TestPerson");
        expect(treeCollection.getName()).toBe("TheTreeCollection");
    });

    it("knows collection updates", function () {
        expect(reob.getCollectionUpdateFunctionNames(Tests.TestPerson)).toBeDefined();
        expect(reob.getCollectionUpdateFunctionNames(Tests.TestPerson)).toContain("collectionUpdateRename");
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

    // this one in thie other is not supported. We can get back to this once we have the time for it.

    // it("can run collection updates from within another collection update", function (done) {
    //     var t1:Tests.TestTree = new Tests.TestTree(15);
    //     treeCollection.insert(t1).then( (id:string)=> {
    //         debugger;
    //         return clientTreeService.growTree( id ).thenReturn( id );
    //     }).then((id)=>{
    //         return client.load("TheTreeCollection", id);
    //     }).then((t:Tests.TestTree)=>{
    //         return Promise.cast(t.collectionUpdateInAnotherCollectionUpdate()).then((r)=>{
    //             expect(r).toBe(10);
    //         }).thenReturn(t.treeId);
    //     }).then((id)=>{
    //         return treeCollection.getByIdOrFail(id);
    //     }).then((t:Tests.TestTree)=>{
    //         expect( t.getLeaves()[0].greenNess ).toBe(3);
    //         done();
    //     }).catch(done.fail);
    // });

    it("can run collection updates from within another method", async function () {
        let t1:Tests.TestTree = new Tests.TestTree(15);
        let id = await treeCollection.insert(t1);
        await  clientTreeService.growTree( id );
        let t = await treeCollection.getByIdOrFail(id);
        expect( t.getLeaves().length ).toBe(1);
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
            return clientTreeService.growTree( id ).then( ()=>id );
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
        expect(reob.getTypedPropertyNames(Tests.TestTree)).toContain('leaves');
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
        var t2 = new reob.Serializer().toObject(doc, treeCollection, Tests.TestTree, new reob.SerializationPath(treeCollection.getName(), "tree1") );
        var sp = reob.SerializationPath.getObjectContext(t2).serializationPath;
        expect( sp ).toBeDefined();
        expect( sp.toString()).toBe("TheTreeCollection[tree1]");
        expect(reob.SerializationPath.getObjectContext(t2.leaves[0]).serializationPath.toString()).toBe("TheTreeCollection[tree1].leaves|leaf11");
    });


    it("uses persistence paths on documents", async done =>{
        try {
            let t1: Tests.TestTree = new Tests.TestTree(10);
            let i: string = await treeCollection.insert(t1);
            let t2: Tests.TestTree = await  treeCollection.getById(i);
            await t2.grow();
            let t = await treeCollection.getById(t2.treeId);
            let sp = reob.SerializationPath.getObjectContext(t).serializationPath;
            expect(sp).toBeDefined();
            expect(sp.toString()).toBe("TheTreeCollection[" + i + "]");
            expect(reob.SerializationPath.getObjectContext(t.leaves[0]).serializationPath.toString()).toBe("TheTreeCollection[" + i + "].leaves|leaf11");
            done();
        }catch( e ){
            done.fail(e);
        }
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
        expect(t1 instanceof Tests.TestTree).toBeTruthy();
        console.log(t1);
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
        expect(reob.getPropertyClass(Tests.TestPerson, "tree")).toBe(Tests.TestTree);
        expect(reob.getPropertyClass(Tests.TestPerson, "leaf")).toBe(Tests.TestLeaf);
    });

    it("knows document names ", function () {

        expect(reob.getDocumentPropertyName(Tests.TestLeaf, "greenNess")).toBe("greenIndex");
        expect(reob.getObjectPropertyName(Tests.TestLeaf, "greenIndex")).toBe("greenNess");
    });

    it("can call functions that have are also webMethods normally", async (done) => {
        var r = await treeCollection.serverFunction("World", new Tests.TestTree(212), 42);
        expect(r).toBe("Hello World!");
        done();
    });

    it("can call functions with undefined parameters", async (done) => {
        await clientTreeService.insertTree(undefined);
        done();
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
        expect(reob.isIgnored(Tests.TestCar, "temperature")).toBeTruthy();
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
        expect(reob.getPropertyClass(Tests.TestInheritanceParent, "childOther")).toBeUndefined();
    });
    //
    it("properties of child objects have a type on the child object", function () {
        expect(reob.getPropertyClass(Tests.TestInheritanceChild, "childOther")).toBe(Tests.TestInheritanceOther);
    });
    //
    it("properties of the parent class have a type on the child class", function () {
        expect(reob.getPropertyClass(Tests.TestInheritanceChild, "parentOther")).toBe(Tests.TestInheritanceOther);
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

    it("stores objects of different classes in an array", function (done) {
        var s:reob.Serializer = new reob.Serializer();
        var person:Tests.TestPerson = new Tests.TestPerson('p1', 'pete');
        var child:Tests.TestInheritanceChild = new Tests.TestInheritanceChild();
        var wheel:Tests.TestWheel = new Tests.TestWheel();
        var car:Tests.TestCar = new Tests.TestCar();
        person.addresses.push(<any>child);
        person.addresses.push(<any>wheel);
        person.addresses.push(<any>car);
        personCollection.insert(person).then( id =>{
            return personCollection.getByIdOrFail(id);
        }).then( person2 =>{
            expect(person2.addresses[0] instanceof Tests.TestInheritanceChild).toBeTruthy();
            expect(person2.addresses[1] instanceof Tests.TestWheel).toBeTruthy();
            expect(person2.addresses[2] instanceof Tests.TestCar).toBeTruthy();
            done();
        });
    });


    it("can get the testwheel class by its configured name", function () {
        var p = reob.getEntityClassByName("TestWheelBanzai")
        expect(p).toBeDefined();
        expect(p).toBe(Tests.TestWheel);
    });

    it("can get the testCar class by its name", function () {
        var p = reob.getEntityClassByName("TestCar");
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
        expect( reob.isPrivateToServer( Tests.TestCar, "privateToServer" ) ).toBeTruthy();
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
            return clientTreeService.growTree( id ).then( ()=>id );
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

    it("can register for before update events and the event listener receives all the correct data.", function (done) {
        var l = spyOnAndCallThrough<reob.UpdateEventListener<Tests.TestTree>>( ( updateEvent:reob.UpdateEvent<Tests.TestTree> )=>{
            expect(updateEvent).toBeDefined();
            if( updateEvent ) {
                expect( updateEvent.rootObject).toBeDefined();
                expect( updateEvent.rootObject instanceof Tests.TestTree).toBeTruthy();
                expect( updateEvent.functionName).toBe("setSomeBooleanTo");
                expect( updateEvent.args).toEqual([true]);
                expect( updateEvent.request).toBeDefined();

                expect( updateEvent.beforeUpdateDocument ).toBeDefined();
                console.log("updateEvent.beforeUpdateDocument", updateEvent.beforeUpdateDocument);
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

    it("can register to after-update-events and the event listener receives all the correct data.", function (done) {
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

    it("knows post create function names", ()=>{
        let names = reob.getPostCreateFunctionNames(Tests.TestTransient);
        expect( names ).toBeDefined();
        expect( names.length ).toBe(1);
        expect( names[0] ).toBe("initialize");
    });


    it("calls functions that are annotated with 'PostCreate' when objects get deserialized", ()=>{
        let s =  new reob.Serializer()
        let t1:Tests.TestPerson = new Tests.TestPerson("tp1");
        t1.testTransient = new Tests.TestTransient("12345");
        let doc = s.toDocument(t1);
        let t2:Tests.TestPerson = s.toObject(doc, undefined, Tests.TestPerson);
        expect(t2.testTransient.ignoredProperty).toBe("hello 12345");
    });

    it("can register to during-update-events and the event listener receives all the correct data.", function (done) {
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
        treeCollection.onDuringUpdate( l );
        console.log(treeCollection['eventListenerRegistry']);
        client.setUserData({Hello:41});
        treeCollection.newTree(10).then((tree)=>{
            return clientTreeService.setSomeBooleanOnTree(tree.treeId, true);
        }).then( (s)=>{
            expect(l).toHaveBeenCalled();
            done();
        });
    });


    it("can register to all update listeners and they are called in the correct order", function (done) {
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
            return new Promise<void>((res,rej)=>{
                setTimeout(()=>{
                    expect( c ).toBe(2);
                    c++;
                    console.log("during resolves");
                    res();
                }, 500)
            });
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
        }).then(()=> {
            return treeCollection.getById(tId);
        }).then((t)=> {
            expect(l).not.toHaveBeenCalled();
            return t.getLeaves()[0].flutter();
        }).then(()=>{
            expect(l).toHaveBeenCalledTimes(1);
            done();
        });
    });

    it("can register to events during updates globally", function (done) {
        var l =  spyOnAndCallThrough( (event:reob.UpdateEvent<Tests.TestTree>)=>{} );
        var lGlobal =  spyOnAndCallThrough( (event:reob.UpdateEvent<Tests.TestTree>)=>{} );
        treeCollection.onDuringUpdate( "fluttering", l );
        treeCollection.onDuringUpdate( lGlobal );
        var tId;
        treeCollection.newTree(10).then((t)=> {
            expect(t).toBeDefined();
            tId = t.treeId;
            return t.grow();
        }).then(()=> {
            return treeCollection.getById(tId);
        }).then((t)=> {
            return t.getLeaves()[0].flutter();
        }).then(()=> {
            return treeCollection.getById(tId);
        }).then((t)=> {
            return t.setSomeBooleanTo(true);
        }).then(()=>{
            expect(l).toHaveBeenCalledTimes(1);
            expect(lGlobal).toHaveBeenCalledTimes(2);
            done();
        });
    });


    it("can receive emitted events from a subobject even if another (the first) event listener throws an exception", async (done) => {
        try {
            var lCancels = spyOnAndCallThrough((event: reob.UpdateEvent<Tests.TestTree>) => {
                throw new Error("I try to cancel this but fail.")
            });
            var l = spyOnAndCallThrough((event: reob.UpdateEvent<Tests.TestTree>) => {
            });
            var lAfter = spyOnAndCallThrough((event: reob.UpdateEvent<Tests.TestTree>) => {
                throw new Error("I am also ignored.")
            });
            var lAfter2 = spyOnAndCallThrough((event: reob.UpdateEvent<Tests.TestTree>) => {
            });

            let t = await treeCollection.newTree(10);
            await t.grow();
            t = await  treeCollection.getById(t.treeId);

            treeCollection.onDuringUpdate("fluttering", lCancels);
            treeCollection.onDuringUpdate("fluttering", l);
            treeCollection.onAfterUpdate(lAfter);
            treeCollection.onAfterUpdate(lAfter2);
            await t.getLeaves()[0].flutter();

            expect(lCancels).toHaveBeenCalledTimes(1);
            expect(l).toHaveBeenCalledTimes(1);
            expect(lAfter).toHaveBeenCalledTimes(1);
            expect(lAfter2).toHaveBeenCalledTimes(1);
            done();
        }catch( e ){
            done.fail(e);
        }
    });


    it("on the server an update function is called and an object is inserted and then another update function is called on the newly inserted object", async done => {
        try{
            let t = await treeCollection.newTree(10);
            await t.grow();
            await t.getLeaves()[0].flutter();
            t = await treeCollection.getById(t.treeId);
            expect( t.getLeaves()[0].greenNess ).toBe(3);
            done();
        }catch( e )  {
            done.fail(e);
        }
    });

    it("can return errors in a promise ", function (done) {
        treeCollection.errorMethod(10).then(()=>{
            done.fail(new Error("still happened"));
        }).catch((err)=>{
            expect(err).toBe("the error");
            done();
        });
    });

    it("can cancel updates", function (done) {
        var lCancels =  spyOnAndCallThrough( (event:reob.UpdateEvent<Tests.TestTree>)=>{ throw new Error("xxx")} );
        treeCollection.onBeforeUpdate( lCancels );
        treeCollection.newTree(10).then((t)=> {
            return Promise.resolve(t.grow()).then(done.fail).catch((r)=>{
                expect( r?r.message:undefined ).toBe("xxx");
            }).then( ()=> t.treeId );
        }).then((tId)=> {
            return treeCollection.getById(tId);
        }).then((t:Tests.TestTree)=> {
            expect(t.getHeight()).toBe(10);
            done();
        }).catch(done.fail);
    });

    it("receives the data from emits", function (done) {
        var l =  spyOnAndCallThrough( (event:reob.UpdateEvent<Tests.TestTree>)=>{
            expect( event.data ).toBe("someBoolean");
        } );
        treeCollection.onDuringUpdate( "gardenevents", l );
        treeCollection.newTree(10).then((t)=> {
            return Promise.resolve(t.setSomeBooleanTo(true));
        }).then((tId)=> {
            expect(l).toHaveBeenCalledTimes(1);
            done();
        }).catch(done.fail);
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

    it("can not register for update events with a function name that is not a collection update function", function (done) {
        expect(()=>{
            treeCollection.onBeforeUpdate( Tests.TestTree, "notAnUpdateFunction123", ()=>{
            } );
        }).toThrow();
        done();
    });

    //// ------------------------ events : methods -----------------------

    it("notifies before method listener", function (done) {
        var l =  spyOnAndCallThrough( (object:any, functionName:string, args:any[], request:reob.Request, result?:any)=>{
            expect( object instanceof Tests.TreeServiceServer).toBeTruthy();
            expect( functionName ).toBe( "setSomeBooleanOnTree" );
            expect( args ).toEqual( [id, true] );
            expect( result ).toBeUndefined();
            expect( request && request.userData ? request.userData.foo : undefined).toBe("barbar");
        } );

        server.onBeforeMethod( l );
        client.setUserData({foo:"barbar"});
        var id;
        treeCollection.newTree(10).then( (t)=> {
            id = t.treeId;
            return clientTreeService.setSomeBooleanOnTree( id, true );
        }).then(()=>{
            expect(l).toHaveBeenCalledTimes(1);
            done();
        }).catch(done.fail);
    });

    it("notifies after method listener", function (done) {
        var l =  spyOnAndCallThrough( (object:any, functionName:string, args:any[], request:reob.Request, result?:any)=>{
            expect( object instanceof Tests.TreeServiceServer).toBeTruthy();
            expect( functionName ).toBe( "setSomeBooleanOnTree" );
            expect( args ).toEqual( [id, true] );
            expect( result ).toBe("added in the service:set to true");
            expect( request && request.userData ? request.userData.foo : undefined).toBe("barbar");
        } );

        server.onAfterMethod( l );
        client.setUserData({foo:"barbar"});
        var id;
        treeCollection.newTree(10).then( (t)=> {
            id = t.treeId;
            return clientTreeService.setSomeBooleanOnTree( id, true );
        }).then(()=>{
            expect(l).toHaveBeenCalledTimes(1);
            done();
        }).catch(done.fail);
    });

    it("can cancel methods", function (done) {
        var l =  spyOnAndCallThrough( (object:any, functionName:string, args:any[], request:reob.Request, result?:any)=>{
            throw new Error("nopingers");
        } );

        server.onBeforeMethod( l );
        client.setUserData({foo:"barbar"});
        var id;
        treeCollection.newTree(10).then( (t)=> {
            id = t.treeId;
            return clientTreeService.setSomeBooleanOnTree( id, true );
        }).then(done.fail).catch((r)=>{
            expect(l).toHaveBeenCalledTimes(1);
            expect(r?r.message:undefined).toBe("nopingers");
            return treeCollection.getById(id);
        }).then((t:Tests.TestTree)=>{
            expect( t.someBoolean ).toBe(false);
            done();
        });
    });

    // test that calls a nested collection update (one in the other)

});
