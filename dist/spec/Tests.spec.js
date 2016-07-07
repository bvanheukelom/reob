/**
 * Created by bert on 23.03.16.
 */
"use strict";
const omm = require("../src/omm");
const Tests = require("./classes/Tests");
const mongodb = require("mongodb");
const Promise = require("bluebird");
var co = require("co");
require("./classes/TestLeaf");
describe("Omm both on client and server", function () {
    var personCollection;
    var treeCollection;
    var clientPersonCollection;
    var clientTreeCollection;
    var server;
    var client;
    var db;
    beforeAll((done) => {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000000;
        omm.init();
        mongodb.MongoClient.connect("mongodb://localhost/test", { promiseLibrary: Promise }).then((d) => {
            db = d;
            personCollection = new Tests.TestPersonCollection(db);
            treeCollection = new Tests.TestTreeCollection(db);
            server = new omm.Server();
            server.addCollection(personCollection);
            server.addCollection(treeCollection);
            server.addSingleton("pc", personCollection);
            server.addSingleton("tc", treeCollection);
            server.start(7000).then(() => {
                done();
            });
            client = new omm.Client('localhost', 7000);
        });
        Promise.onPossiblyUnhandledRejection((reason) => {
            console.log("possibly unhandled rejection ", reason);
            debugger;
        });
    });
    beforeEach(() => {
        personCollection.removeAllListeners();
        treeCollection.removeAllListeners();
        omm.removeAllUpdateEventListeners();
    });
    it("knows the difference between root entities and subdocument entities ", function () {
        expect(omm.PersistenceAnnotation.getCollectionName(Tests.TestPerson)).toBe("TestPerson");
        expect(omm.PersistenceAnnotation.isRootEntity(Tests.TestPerson)).toBeTruthy();
        expect(omm.PersistenceAnnotation.isRootEntity(Tests.TestTree)).toBeTruthy();
        expect(omm.PersistenceAnnotation.isRootEntity(Tests.TestLeaf)).toBeFalsy();
    });
    it("knows meteor method annotations ", function () {
        var methodNames = omm.PersistenceAnnotation.getMethodFunctionNames(Tests.TestPerson.prototype);
        expect(methodNames).toContain("addAddress");
        expect(methodNames.length).toBeGreaterThan(0);
    });
    it("knows the name of collections", function () {
        expect(personCollection.getName()).toBe("TestPerson");
        expect(treeCollection.getName()).toBe("TheTreeCollection");
    });
    it("knows collection updates", function () {
        debugger;
        expect(omm.PersistenceAnnotation.getCollectionUpdateFunctionNames(Tests.TestPerson)).toBeDefined();
        expect(omm.PersistenceAnnotation.getCollectionUpdateFunctionNames(Tests.TestPerson)).toContain("collectionUpdateRename");
    });
    it("can clone stuff", function () {
        var t1 = new Tests.TestTree(10);
        t1.grow();
        var clone = omm.clone(t1);
        expect(clone instanceof Tests.TestTree).toBeTruthy();
    });
    it("can serialize sub objects", function () {
        var t1 = new Tests.TestTree(10);
        t1.grow();
        var doc = new omm.Serializer().toDocument(t1);
        expect(doc.thoseGreenThings).toBeDefined();
        expect(doc.thoseGreenThings.length).toBe(1);
        expect(doc.thoseGreenThings[0] instanceof Tests.TestLeaf).toBeFalsy();
    });
    it("knows typed properties", function () {
        expect(omm.PersistenceAnnotation.getTypedPropertyNames(Tests.TestTree)).toContain('leaves');
    });
    it("uses persistence paths to return undefined for non existent subobjects ", function () {
        var t1 = new Tests.TestTree(10);
        var pp = new omm.SerializationPath("TestTree", "tree1");
        pp.appendArrayOrMapLookup("leaves", "nonexistentLeaf");
        expect(pp.getSubObject(t1)).toBeUndefined();
    });
    it("uses persistence paths on root documents", function () {
        var t1 = new Tests.TestTree(123);
        t1.treeId = "tree1";
        t1.grow();
        // debugger;
        omm.SerializationPath.updateObjectContexts(t1);
        var sp = omm.SerializationPath.getObjectContext(t1).serializationPath;
        expect(sp).toBeDefined();
        expect(sp.toString()).toBe("TheTreeCollection[tree1]");
        expect(omm.SerializationPath.getObjectContext(t1.leaves[0]).serializationPath.toString()).toBe("TheTreeCollection[tree1].leaves|leaf124");
    });
    it("uses persistence paths on sub documents", function () {
        var tp = new Tests.TestPerson("tp1");
        tp.phoneNumber = new Tests.TestPhoneNumber("12345");
        omm.SerializationPath.updateObjectContexts(tp);
        var sp = omm.SerializationPath.getObjectContext(tp.phoneNumber).serializationPath;
        expect(sp).toBeDefined();
        expect(sp.toString()).toBe("TestPerson[tp1].phoneNumber");
    });
    //
    it("can call wrapped functions that are not part of a collection", function () {
        var t1 = new Tests.TestTree(10);
        t1.grow();
        expect(t1.getLeaves().length).toBe(1);
    });
    //
    it("uses persistence paths on subdocuments in arrays", function () {
        var t1 = new Tests.TestTree(10);
        t1.treeId = "tree1";
        t1.grow();
        omm.SerializationPath.updateObjectContexts(t1);
        expect(t1.getLeaves().length).toBe(1);
        var sp = omm.SerializationPath.getObjectContext(t1.getLeaves()[0]).serializationPath;
        expect(sp).toBeDefined();
        expect(sp.toString()).toBe("TheTreeCollection[tree1].leaves|leaf11");
    });
    //
    it("serializes basic objects", function () {
        var t1 = new Tests.TestPerson("tp1");
        t1.phoneNumber = new Tests.TestPhoneNumber("12345");
        var doc = new omm.Serializer().toDocument(t1);
        expect(doc._id).toBe("tp1");
        expect(doc["phoneNumber"]["pn"]).toBe("12345");
    });
    // //
    it("deserializes basic objects", function () {
        var serializer = new omm.Serializer();
        var t1 = new Tests.TestPerson("tp1");
        t1.phoneNumber = new Tests.TestPhoneNumber("12345");
        var doc = serializer.toDocument(t1);
        var t1 = serializer.toObject(doc, Tests.TestPerson);
        expect(t1.getId()).toBe("tp1");
        expect(t1.phoneNumber instanceof Tests.TestPhoneNumber).toBeTruthy();
        expect(t1.phoneNumber.getNumber()).toBe("12345");
    });
    it("deserializes objects that have subobjects", function () {
        var serializer = new omm.Serializer();
        var t1 = new Tests.TestTree(123);
        t1.treeId = "t1";
        t1.grow();
        var doc = serializer.toDocument(t1);
        var t1 = serializer.toObject(doc, Tests.TestTree);
        expect(t1.treeId).toBe("t1");
        expect(t1.getLeaves()[0] instanceof Tests.TestLeaf).toBeTruthy();
    });
    it("deserializes objects that have document names", function () {
        var serializer = new omm.Serializer();
        var t1 = new Tests.TestTree(123);
        t1.treeId = "t1";
        t1.grow();
        var doc = serializer.toDocument(t1);
        expect(doc.thoseGreenThings[0].greenIndex).toBe(t1.getLeaves()[0].greenNess);
    });
    it("knows the difference between root entities and subdocument entities ", function () {
        expect(omm.PersistenceAnnotation.getCollectionName(Tests.TestPerson)).toBe("TestPerson");
        expect(omm.PersistenceAnnotation.isRootEntity(Tests.TestPerson)).toBeTruthy();
        expect(omm.PersistenceAnnotation.isRootEntity(Tests.TestTree)).toBeTruthy();
        expect(omm.PersistenceAnnotation.isRootEntity(Tests.TestLeaf)).toBeFalsy();
    });
    it("knows types ", function () {
        expect(omm.PersistenceAnnotation.getPropertyClass(Tests.TestPerson, "tree")).toBe(Tests.TestTree);
        expect(omm.PersistenceAnnotation.getPropertyClass(Tests.TestPerson, "leaf")).toBe(Tests.TestLeaf);
    });
    it("knows document names ", function () {
        expect(omm.PersistenceAnnotation.getDocumentPropertyName(Tests.TestLeaf, "greenNess")).toBe("greenIndex");
        expect(omm.PersistenceAnnotation.getObjectPropertyName(Tests.TestLeaf, "greenIndex")).toBe("greenNess");
    });
    it("can call functions that have are also webMethods normally", function (done) {
        Promise.cast(treeCollection.serverFunction("World", new Tests.TestTree(212), 42)).then((r) => {
            expect(r).toBe("Hello World!");
            done();
        });
    });
    it("can monkey patch functions", function () {
        var f = function f() {
            this.c = 0;
        };
        f.prototype.hello = function (p) {
            this.c += p;
        };
        omm.MeteorPersistence.monkeyPatch(f.prototype, "hello", function (original, p) {
            expect(this.c).toBe(0);
            this.c++;
            original.call(this, p);
        });
        var x = new f();
        x.hello(20);
        expect(x.c).toBe(21);
    });
    it("serializes objects to plain objects", function () {
        var tp = new Tests.TestPerson("tp");
        tp.tree = new Tests.TestTree(12);
        var serializer = new omm.Serializer();
        var doc = serializer.toDocument(tp);
        expect(doc.tree instanceof Tests.TestTree).toBeFalsy();
    });
    //
    //
    it("can serialize object in a map", function () {
        var tp = new Tests.TestPerson("tp");
        tp.phoneBook["klaus"] = new Tests.TestPhoneNumber("121212");
        var serializer = new omm.Serializer();
        var doc = serializer.toDocument(tp);
        expect(doc).toBeDefined();
        expect(doc.phoneBook).toBeDefined();
        expect(doc.phoneBook["klaus"]).toBeDefined();
        expect(doc.phoneBook["klaus"].pn).toBeDefined();
    });
    it("serializes the classname of unexpected objects", function () {
        var t = new Tests.TestPerson("id1", "jake");
        t.addresses.push(new Tests.TestLeaf("leafId1"));
        var doc = new omm.Serializer().toDocument(t);
        expect(doc["addresses"][0].className).toBe("TestLeaf");
        expect(doc["addresses"][0]._id).toBe("leafId1");
    });
    //
    it("deserializes unexpected objects", function () {
        var t = new Tests.TestPerson("id1", "jake");
        t.addresses.push(new Tests.TestLeaf("leafId1"));
        var s = new omm.Serializer();
        var doc = s.toDocument(t);
        var o = s.toObject(doc, Tests.TestPerson);
        expect(o instanceof Tests.TestPerson).toBeTruthy();
        expect(o.addresses[0] instanceof Tests.TestLeaf).toBeTruthy();
    });
    //
    it("deserializes local objects", function () {
        var car = new Tests.TestCar();
        car.brand = "VW";
        car.wheel = new Tests.TestWheel();
        car.wheel.car = car;
        car.wheel.radius = 10;
        var s = new omm.Serializer();
        var document = s.toDocument(car);
        var otherCar = s.toObject(document, Tests.TestCar);
        var doc = s.toDocument(otherCar);
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
        var s = new omm.Serializer();
        var doc = s.toDocument(car);
        var otherCar = s.toObject(doc, Tests.TestCar);
        expect(otherCar).toBeDefined();
        expect(otherCar.brand).toBe("VW");
        expect(otherCar.wheel.radius).toBe(10);
        expect(otherCar instanceof Tests.TestCar).toBeTruthy();
    });
    it("doesnt serialize ignored properties", function () {
        var car = new Tests.TestCar();
        car.brand = "VW";
        car.temperature = "hot";
        var s = new omm.Serializer();
        var doc = s.toDocument(car);
        expect(doc.brand).toBe("VW");
        expect(doc.temperature).toBeUndefined();
    });
    it("marks properties as ignored", function () {
        expect(omm.PersistenceAnnotation.isIgnored(Tests.TestCar, "temperature")).toBeTruthy();
    });
    //
    it("deserializes local objects with arrays", function () {
        var car = new Tests.TestCar();
        car.wheels.push(new Tests.TestWheel());
        car.wheels.push(new Tests.TestWheel());
        car.wheels.push(new Tests.TestWheel());
        car.wheels.push(new Tests.TestWheel());
        var s = new omm.Serializer();
        var doc = s.toDocument(car);
        expect(doc).toBeDefined();
        expect(doc.wheels).toBeDefined();
        expect(doc.wheels.length).toBe(4);
    });
    //
    it("serializes local objects with arrays", function () {
        var s = new omm.Serializer();
        var otherCar = s.toObject({
            brand: "Monster",
            wheels: [{}, {}, {}, { radius: 12 }]
        }, Tests.TestCar);
        expect(otherCar).toBeDefined();
        expect(otherCar.brand).toBe("Monster");
        expect(otherCar.wheels[3].radius).toBe(12);
        expect(otherCar.wheels[2].radius).toBeUndefined();
        expect(otherCar.wheels[2] instanceof Tests.TestWheel).toBeTruthy();
        expect(otherCar instanceof Tests.TestCar).toBeTruthy();
    });
    //
    it("properties of child objects have no type on the parent object", function () {
        expect(omm.PersistenceAnnotation.getPropertyClass(Tests.TestInheritanceParent, "childOther")).toBeUndefined();
    });
    //
    it("properties of child objects have a type on the child object", function () {
        expect(omm.PersistenceAnnotation.getPropertyClass(Tests.TestInheritanceChild, "childOther")).toBe(Tests.TestInheritanceOther);
    });
    //
    it("properties of the parent class have a type on the child class", function () {
        expect(omm.PersistenceAnnotation.getPropertyClass(Tests.TestInheritanceChild, "parentOther")).toBe(Tests.TestInheritanceOther);
    });
    //
    it("serializes local objects with inheritance", function () {
        var s = new omm.Serializer();
        var child = new Tests.TestInheritanceChild();
        child.childOther = new Tests.TestInheritanceOther();
        child.childOther.name = "Otter";
        child.childOther.otherness = 42;
        child.parentOther = new Tests.TestInheritanceOther();
        child.parentOther.name = "Groundhog";
        child.parentOther.otherness = 84;
        var doc = s.toDocument(child);
        var child2 = s.toObject(doc, Tests.TestInheritanceChild);
        expect(child2.parentOther instanceof Tests.TestInheritanceOther).toBeTruthy();
        expect(!(child2.childOther instanceof Tests.TestInheritanceOther)).toBeFalsy();
        expect(child.getChildThing()).toBe("Otter 42 Groundhog 84");
    });
    //
    it("serializes local parent objects with inheritance", function () {
        var s = new omm.Serializer();
        var parent = new Tests.TestInheritanceParent();
        parent.parentOther = new Tests.TestInheritanceOther();
        parent.parentOther.name = "Groundhog";
        parent.parentOther.otherness = 84;
        var doc = s.toDocument(parent);
        var parent2 = s.toObject(doc, Tests.TestInheritanceParent);
        expect(parent2.parentOther instanceof Tests.TestInheritanceOther).toBeTruthy();
        expect(doc.parentOther instanceof Tests.TestInheritanceOther).toBeFalsy();
    });
    //
    it("ignores properties that need to be ignored on parent properties", function () {
        var s = new omm.Serializer();
        var child = new Tests.TestInheritanceChild();
        child.ignoredOther = new Tests.TestInheritanceOther();
        child.ignoredOther.name = "I need to be ignored";
        child.parentOther = new Tests.TestInheritanceOther();
        child.parentOther.name = "Groundhog";
        child.parentOther.otherness = 84;
        var doc = s.toDocument(child);
        var child2 = s.toObject(doc, Tests.TestInheritanceChild);
        expect(doc.ignoredOther).toBeUndefined();
        expect(child2.ignoredOther).toBeUndefined();
    });
    it("can do basic inserts", function (done) {
        debugger;
        treeCollection.newTree(20).then((tree) => {
            expect(tree).toBeDefined();
            expect(tree instanceof Tests.TestTree).toBeTruthy();
            expect(tree.treeId).toBeDefined();
            expect(tree.getHeight()).toBe(20);
            return treeCollection.getById(tree.treeId);
        }).then((tree) => {
            expect(tree).toBeDefined();
            expect(tree.treeId).toBeDefined();
            expect(tree.getHeight()).toBe(20);
            done();
        }).catch((ee) => {
            fail(ee);
            done();
        });
    });
    it("updates the collection", function (done) {
        var id;
        personCollection.newPerson('bert').then((e) => {
            id = e.getId();
            return e.collectionUpdateRename("klaus");
        }).then((n) => {
            return personCollection.getById(id);
        }).then((p) => {
            expect(p.getName()).toBe("Collection Update:klaus");
            done();
        }).catch((e) => {
            fail(e);
            done();
        });
    });
    it("can save foreign keys in a map", function (done) {
        var personPromise = personCollection.newPerson("Held");
        var tree1Promise = treeCollection.newTree(13);
        var tree2Promise = treeCollection.newTree(12);
        debugger;
        Promise.all([tree1Promise, tree2Promise, personPromise]).then((values) => {
            var t1 = values[0];
            var t2 = values[1];
            var held = values[2];
            var ap1 = held.addToWood(t1, "peterKey").then((r) => {
                return r;
            });
            var ap2 = held.addToWood(t2, "klausKey").then((r) => {
                return r;
            });
            return Promise.all([ap1, ap2]);
        }).then((arr) => {
            return Promise.all([personPromise.then((held) => {
                    return personCollection.getById(held.getId());
                }), tree1Promise]);
        }).then((arr) => {
            debugger;
            var held = arr[0];
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
        treeCollection.newTree(20).then((t) => {
            treeId = t.treeId;
        }).then(() => {
            return treeCollection.getById(treeId);
        }).then((t) => {
            expect(t).toBeDefined();
            return treeCollection.deleteTree(treeId);
        }).then(() => {
            return treeCollection.getById(treeId);
        }).then((t) => {
            expect(t).toBeUndefined();
            done();
        }).catch((err) => {
            fail(err);
            done();
        });
    });
    it("removes all", function () {
        // this test tests the before all thing
        expect(true).toBeTruthy();
    });
    it("deserializes objects of different classes in an array", function () {
        var s = new omm.Serializer();
        var person = new Tests.TestPerson('p1', 'pete');
        var child = new Tests.TestInheritanceChild();
        var wheel = new Tests.TestWheel();
        var car = new Tests.TestCar();
        person.addresses.push(child);
        person.addresses.push(wheel);
        person.addresses.push(car);
        var doc = s.toDocument(person);
        var person2 = s.toObject(doc, Tests.TestPerson);
        expect(person2.addresses[0] instanceof Tests.TestInheritanceChild).toBeTruthy();
        expect(person2.addresses[1] instanceof Tests.TestWheel).toBeTruthy();
        expect(person2.addresses[2] instanceof Tests.TestCar).toBeTruthy();
    });
    it("can get the testwheel class by its configured name", function () {
        var p = omm.PersistenceAnnotation.getEntityClassByName("TestWheelBanzai");
        expect(p).toBeDefined();
        expect(p).toBe(Tests.TestWheel);
    });
    it("can get the testCar class by its name", function () {
        var p = omm.PersistenceAnnotation.getEntityClassByName("TestCar");
        expect(p).toBeDefined();
        expect(p).toBe(Tests.TestCar);
    });
    it("verifies that updates fail if the id is not given ", function (done) {
        personCollection.update(undefined, function () {
        }).then(() => {
            fail("did succeed");
            done();
        }).catch(() => {
            done();
        });
    });
    it("invokes didInsert events", function (done) {
        var l = {};
        l.listener = function (event) {
            expect(event.object instanceof Tests.TestTree).toBeTruthy();
            expect(event.cancelledWithError()).toBeFalsy();
        };
        spyOn(l, 'listener').and.callThrough();
        treeCollection.onInsert(l.listener);
        treeCollection.newTree(10).then(() => {
            expect(l.listener).toHaveBeenCalled();
            done();
        });
        //fail();
        //done();
    });
    it("can cancel inserts", function (done) {
        var l = {};
        l.listener = function (event) {
            event.cancel("Not allowed");
        };
        spyOn(l, 'listener').and.callThrough();
        treeCollection.preInsert(l.listener);
        var previousSize;
        var previousSizePromise = treeCollection.getAll().then((arr) => {
            previousSize = arr.length;
        });
        previousSizePromise.then(() => {
            debugger;
            return treeCollection.newTree(10);
        }).then(() => {
            fail('false success');
            done();
        }).catch((err) => {
            treeCollection.getAll().then((arr) => {
                expect(arr.length).toBe(previousSize);
                done();
            });
        });
    });
    it("can handle thrown errors", function (done) {
        treeCollection.newTree(10).then((tree) => {
            return tree.thisThrowsAnError();
        }).catch((err) => {
            expect(err).toBeDefined();
            expect(err instanceof Error).toBeTruthy();
            done();
        });
    });
    it("invokes deletition events", function (done) {
        var l = {};
        l.listener = function (event) {
        };
        spyOn(l, 'listener').and.callThrough();
        treeCollection.onRemove(l.listener);
        treeCollection.newTree(10).then((tree) => {
            expect(tree).toBeDefined();
            return treeCollection.deleteTree(tree.treeId);
        }).then(() => {
            expect(l.listener).toHaveBeenCalled();
            done();
        });
    });
    it("trees have leaves", function (done) {
        var tId;
        treeCollection.newTree(10).then((t) => {
            debugger;
            tId = t.treeId;
            expect(t).toBeDefined();
            return t.grow();
        }).then((values) => {
            return treeCollection.getById(tId);
        }).then((t) => {
            expect(t.getLeaves()[0]).toBeDefined();
            done();
        });
    });
    //
    it("can receive emitted events from a subobject", function (done) {
        var l = {};
        l.listener = function (event) {
        };
        spyOn(l, 'listener').and.callThrough();
        omm.on(Tests.TestLeaf, "fluttering", l.listener);
        var tId;
        treeCollection.newTree(10).then((t) => {
            expect(t).toBeDefined();
            tId = t.treeId;
            return t.grow();
        }).then((values) => {
            return treeCollection.getById(tId);
        }).then((t) => {
            expect(l.listener).not.toHaveBeenCalled();
            debugger;
            return t.getLeaves()[0].flutter();
        }).then(() => {
            expect(l.listener).toHaveBeenCalled();
            done();
        });
    });
    //
    it("can receive emitted events from a subobject even if another (the first) event listener throws an exception", function (done) {
        var l = {};
        l.listener1 = function (event) {
            debugger;
            // throw "freekish error";
        };
        l.listener2 = function (event) {
            debugger;
        };
        spyOn(l, 'listener1').and.callThrough();
        spyOn(l, 'listener2').and.callThrough();
        omm.on(Tests.TestLeaf, "fluttering", l.listener1);
        omm.on(Tests.TestLeaf, "fluttering", l.listener2);
        var treePromise = treeCollection.newTree(10);
        var treeIdPromise = treePromise.then((t) => {
            return t.treeId;
        });
        var growPromise = treePromise.then((t) => {
            return t.grow();
        });
        treePromise = Promise.all([growPromise, treeIdPromise]).then((values) => {
            var treeId = values[1];
            return treeCollection.getById(treeId);
        });
        var flutterPromise = treePromise.then((t) => {
            return t.getLeaves()[0].flutter();
        }).then((t) => {
            expect(l.listener1).toHaveBeenCalled();
            expect(l.listener2).toHaveBeenCalled();
            done();
        }).catch((e) => {
            fail();
            done();
        });
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
    it("can receive emitted events from a subobject and get the object", function (done) {
        var l = {};
        l.listener = function (event) {
            expect(event.object instanceof Tests.TestLeaf).toBeTruthy();
        };
        spyOn(l, 'listener').and.callThrough();
        omm.on(Tests.TestLeaf, "fluttering", l.listener);
        co(function* () {
            debugger;
            var tree = yield treeCollection.newTree(10);
            debugger;
            yield tree.grow();
            debugger;
            var tree2 = yield treeCollection.getById(tree.treeId);
            debugger;
            expect(l.listener).not.toHaveBeenCalled();
            yield tree2.getLeaves()[0].flutter();
            expect(l.listener).toHaveBeenCalled();
            done();
        });
    });
    //
    it("can return errors in a promise ", function (done) {
        co(function* () {
            try {
                var err = yield treeCollection.errorMethod(10);
                fail();
                done();
            }
            catch (err) {
                expect(err).toBe("the error");
                done();
            }
        });
    });
    it("can cancel deletes ", function (done) {
        var l = {};
        l.listener = function (event) {
            event.cancel("nope");
        };
        spyOn(l, 'listener').and.callThrough();
        treeCollection.preRemove(l.listener);
        var treeId;
        treeCollection.newTree(10).then((tree) => {
            treeId = tree.treeId;
            return treeCollection.deleteTree(tree.treeId);
        }).catch((error) => {
            expect(error).toBe("nope");
            expect(l.listener).toHaveBeenCalled();
            treeCollection.getById(treeId).then((tree) => {
                expect(tree).toBeDefined();
                done();
            });
        });
    });
    it("can register for pre update events", function (done) {
        var l = {};
        l.listener = function (event) {
            expect(event.object).toBeDefined();
            expect(event.object instanceof Tests.TestTree).toBeTruthy();
            var tt = event.object;
            expect(tt.getLeaves().length).toBe(0);
        };
        spyOn(l, 'listener').and.callThrough();
        omm.preUpdate(Tests.TestTree, "grow", l.listener);
        var treePromise = treeCollection.newTree(10);
        treePromise.then((tree) => {
            return Promise.all([tree.grow(), treePromise]);
            ;
        }).then((values) => {
            expect(l.listener).toHaveBeenCalled();
            done();
        });
    });
    //
    it("can cancel updates on a subobject in a generic listener", function (done) {
        var l = {};
        l.listener = function (event) {
            event.cancel("not happening");
        };
        spyOn(l, 'listener').and.callThrough();
        omm.preUpdate(Tests.TestTree, l.listener);
        treeCollection.newTree(10).then((tree) => {
            return tree.grow();
        }).catch((reason) => {
            expect(reason).toBe("not happening");
            expect(l.listener).toHaveBeenCalled();
            done();
        });
    });
    it("can cancel updates on a subobject in a generic listener on a subobject", function (done) {
        var l = {};
        l.listener = function (event) {
            event.cancel("not happening either");
        };
        spyOn(l, 'listener').and.callThrough();
        omm.preUpdate(Tests.TestLeaf, l.listener);
        var treePromise = treeCollection.newTree(10);
        treePromise.then((tree) => {
            return Promise.all([tree.grow(), treePromise]);
        }).then((values) => {
            return treeCollection.getById(values[1].treeId);
        }).then((tree) => {
            return tree.getLeaves()[0].flutter();
        }).catch((err) => {
            expect(err).toBe("not happening either");
            expect(l.listener).toHaveBeenCalled();
            done();
        });
    });
    function pit(s, f) {
        it(s, function (done) {
            var promise = f();
            promise.then(() => {
                done();
            }).catch((err) => {
                fail(err);
                done();
            });
        });
    }
    pit("can register for post update events", function (done) {
        var l = {};
        l.listener = function (event) {
            expect(event.object).toBeDefined();
            expect(event.object instanceof Tests.TestTree).toBeTruthy();
            var tt = event.object;
            expect(tt.getLeaves().length + 1000).toBe(1001); //
        };
        spyOn(l, 'listener').and.callThrough();
        omm.onUpdate(Tests.TestTree, "grow", l.listener);
        var treePromise = treeCollection.newTree(10);
        return treePromise.then((tree) => {
            return Promise.all([tree.grow(), treePromise]);
        }).then((values) => {
            return treeCollection.getById(values[1].treeId);
        }).then((tree) => {
            expect(l.listener).toHaveBeenCalled();
            expect(tree.getLeaves().length).toBe(1);
        });
    });
    //
    it("can cancel updates", function (done) {
        var l = {};
        l.listener = function (event) {
            event.cancel("nope");
        };
        spyOn(l, 'listener').and.callThrough();
        omm.preUpdate(Tests.TestTree, "grow", l.listener);
        var treeId;
        var treePromise = treeCollection.newTree(10);
        return treePromise.then((tree) => {
            treeId = tree.treeId;
            return Promise.all([tree.grow(), treePromise]);
        }).catch((err) => {
            expect(err).toBe("nope");
            treeCollection.getById(treeId).then((nt) => {
                expect(nt.getLeaves().length).toBe(0);
                done();
            });
        });
    });
    //
    it("can register to update events", function (done) {
        var l = {};
        var n = [];
        l.listener = function (event, data) {
            n.push(data);
        };
        spyOn(l, 'listener').and.callThrough();
        omm.on(Tests.TestTree, "gardenevents", l.listener);
        var treePromise = treeCollection.newTree(10);
        return treePromise.then((tree) => {
            return Promise.all([tree.wither(), treePromise]);
        }).then((values) => {
            return treeCollection.getById(values[1].treeId);
        }).then((tree) => {
            expect(l.listener).toHaveBeenCalled();
            expect(n).toContain("withered");
            expect(n).toContain("withered2");
            done();
        });
    });
    it("can register to all update events", function (done) {
        var l = {};
        var n = [];
        l.listener = function (event, data) {
            n.push(data);
        };
        spyOn(l, 'listener').and.callThrough();
        omm.on(Tests.TestTree, "preSave", l.listener);
        treeCollection.newTree(10).then((t) => {
            return t.wither();
        }).then(() => {
            expect(l.listener).toHaveBeenCalled();
            done();
        });
    });
    it("can load trees ", function (done) {
        treeCollection.newTree(20)
            .then((tree) => {
            console.log("Tree id", tree.treeId);
            debugger;
            return client.load(Tests.TestTree, tree.treeId);
        })
            .then((tree) => {
            expect(tree).toBeDefined();
            done();
        });
    });
    it("can load trees and call stuff on it", function (done) {
        var treeId;
        treeCollection.newTree(20)
            .then((tree) => {
            console.log("Tree id", tree.treeId);
            treeId = tree.treeId;
            expect(tree.getHeight()).toBe(20);
            return client.load(Tests.TestTree, tree.treeId);
        })
            .then((tree) => {
            expect(tree).toBeDefined();
            expect(tree.getHeight()).toBe(20);
            var growPromise = tree.grow();
            return growPromise;
        })
            .then((s) => {
            return client.load(Tests.TestTree, treeId);
        })
            .then((tree) => {
            expect(tree.getHeight()).toBe(21);
            done();
        });
    });
});
//# sourceMappingURL=Tests.spec.js.map