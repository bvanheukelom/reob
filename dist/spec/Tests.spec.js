"use strict";
/**
 * Created by bert on 23.03.16.
 */
require("./classes/TestLeaf");
var omm = require("../src/omm");
var Tests = require("./classes/Tests");
var mongodb = require("mongodb");
var Promise = require("bluebird");
var express = require("express");
var co = require("co");
require("./classes/TestLeaf");
jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000000;
describe("Omm both on client and server", function () {
    var personCollection;
    var treeCollection;
    var treeService;
    var clientTreeService;
    var server;
    var client;
    var db;
    beforeAll(function (done) {
        omm.init();
        mongodb.MongoClient.connect("mongodb://localhost/test", { promiseLibrary: Promise }).then(function (d) {
            var app = express();
            server = new omm.Server(app);
            db = d;
            personCollection = new Tests.TestPersonCollection(db);
            treeCollection = new Tests.TestTreeCollection(db);
            treeService = new Tests.TreeService(treeCollection, personCollection);
            clientTreeService = new Tests.TreeService();
            server.addCollection(personCollection);
            server.addCollection(treeCollection);
            server.addSingleton("ts", treeService);
            client = new omm.Client('localhost', 7000);
            client.addSingleton("ts", clientTreeService);
            app.listen(7000, function () {
                done();
            });
        });
        Promise.onPossiblyUnhandledRejection(function (reason) {
            console.log("possibly unhandled rejection ", reason);
            debugger;
        });
    });
    var count = 0;
    beforeEach(function () {
        count++;
        console.log("-------" + (count));
        // console.log(jasmine.getEnv().currentSpec.getFullName());
        personCollection.removeAllListeners();
        treeCollection.removeAllListeners();
        omm.removeAllUpdateEventListeners();
    });
    // it("knows the difference between root entities and subdocument entities ", function () {
    //     expect(omm.PersistenceAnnotation.getCollectionName(Tests.TestPerson)).toBe("TestPerson");
    //     expect(omm.PersistenceAnnotation.isRootEntity(Tests.TestPerson)).toBeTruthy();
    //     expect(omm.PersistenceAnnotation.isRootEntity(Tests.TestTree)).toBeTruthy();
    //     expect(omm.PersistenceAnnotation.isRootEntity(Tests.TestLeaf)).toBeFalsy();
    // });
    it("knows meteor method annotations ", function () {
        var methodNames = omm.PersistenceAnnotation.getMethodFunctionNames(Tests.TestPerson.prototype);
        expect(methodNames).toContain("TestPerson.addAddress");
        expect(methodNames.length).toBeGreaterThan(0);
    });
    it("knows the name of collections", function () {
        expect(personCollection.getName()).toBe("TestPerson");
        expect(treeCollection.getName()).toBe("TheTreeCollection");
    });
    it("knows collection updates", function () {
        expect(omm.PersistenceAnnotation.getCollectionUpdateFunctionNames(Tests.TestPerson)).toBeDefined();
        expect(omm.PersistenceAnnotation.getCollectionUpdateFunctionNames(Tests.TestPerson)).toContain("collectionUpdateRename");
    });
    it("can clone stuff", function () {
        var t1 = new Tests.TestTree(10);
        t1.grow();
        var clone = omm.clone(t1);
        expect(clone instanceof Tests.TestTree).toBeTruthy();
    });
    it("can load objects that have sub objects", function (done) {
        var id = Date.now() + "t444";
        var t1 = new Tests.TestPerson(id);
        t1.phoneNumber = new Tests.TestPhoneNumber("1212");
        personCollection.insert(t1).then(function (id) {
            return personCollection.getById(id);
        }).then(function (p) {
            expect(p).toBeDefined();
            expect(p.phoneNumber instanceof Tests.TestPhoneNumber).toBeTruthy();
            done();
        });
    });
    it("can run collection updates from within another method", function (done) {
        var t1 = new Tests.TestTree(15);
        treeCollection.insert(t1).then(function (id) {
            return clientTreeService.growTree(id).thenReturn(id);
        }).then(function (id) {
            return treeCollection.getByIdOrFail(id);
        }).then(function (t) {
            expect(t.getLeaves().length).toBe(1);
            done();
        });
    });
    it("can load objects that have sub objects (in an array) which have a parent reference ", function (done) {
        var t1 = new Tests.TestTree(10);
        var i;
        treeCollection.insert(t1).then(function (id) {
            i = id;
            return treeCollection.getById(id);
        }).then(function (t) {
            return t.grow();
        }).then(function () {
            return treeCollection.getById(i);
        }).then(function (t) {
            treeCollection;
            expect(t).toBeDefined();
            expect(t.getLeaves()[0] instanceof Tests.TestLeaf).toBeTruthy();
            expect(t.getLeaves()[0].getTree() instanceof Tests.TestTree).toBeTruthy();
            done();
        });
    });
    it("can load objects that are embedded deeper in a non entity structure", function (done) {
        var t1 = new Tests.TestTree(10);
        var i;
        debugger;
        Promise.all([treeCollection.insert(t1), personCollection.newPerson("norbert")]).then(function (arr) {
            return clientTreeService.aTreeAndAPerson(arr[0], arr[1].getId());
        }).then(function (arr) {
            expect(arr).toBeDefined();
            expect(arr.length).toBe(2);
            var tree = arr[0];
            var person = arr[1];
            expect(tree instanceof Tests.TestTree).toBeTruthy();
            expect(person instanceof Tests.TestPerson).toBeTruthy();
            expect(person instanceof Tests.TestPerson).toBeTruthy();
            var r = tree.grow();
            expect(r.then).toBeDefined();
            done();
        });
    });
    it("can save objects that have sub objects (in an array) which have a parent reference", function (done) {
        var t1 = new Tests.TestTree(10);
        t1.grow();
        var i;
        treeCollection.insert(t1).then(function (id) {
            i = id;
            return treeCollection.getById(id);
        }).then(function (t) {
            expect(t).toBeDefined();
            expect(t.getLeaves()[0] instanceof Tests.TestLeaf).toBeTruthy();
            done();
        });
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
    it("uses persistence paths on documents", function () {
        var t1 = new Tests.TestTree(10);
        t1.treeId = "tree1";
        t1.grow();
        var doc = new omm.Serializer().toDocument(t1);
        debugger;
        var t2 = new omm.Serializer().toObject(doc, treeCollection, Tests.TestTree, new omm.SerializationPath(treeCollection.getName(), "tree1"));
        var sp = omm.SerializationPath.getObjectContext(t2).serializationPath;
        expect(sp).toBeDefined();
        expect(sp.toString()).toBe("TheTreeCollection[tree1]");
        expect(omm.SerializationPath.getObjectContext(t2.leaves[0]).serializationPath.toString()).toBe("TheTreeCollection[tree1].leaves|leaf11");
    });
    it("uses persistence paths on documents", function () {
        var t1 = new Tests.TestTree(10);
        var i;
        treeCollection.insert(t1).then(function (id) {
            i = id;
            return treeCollection.getById(id);
        }).then(function (t) {
            return Promise.cast(t.grow()).then(function () { return treeCollection.getById(t.treeId); });
        }).then(function (t) {
            var sp = omm.SerializationPath.getObjectContext(t).serializationPath;
            expect(sp).toBeDefined();
            expect(sp.toString()).toBe("TheTreeCollection[" + i + "]");
            expect(omm.SerializationPath.getObjectContext(t1.leaves[0]).serializationPath.toString()).toBe("TheTreeCollection[" + i + "].leaves|leaf11");
        });
    });
    it("can call wrapped functions that are not part of a collection", function () {
        var t1 = new Tests.TestTree(10);
        t1.grow();
        expect(t1.getLeaves().length).toBe(1);
    });
    it("serializes basic objects", function () {
        var t1 = new Tests.TestPerson("tp1");
        t1.phoneNumber = new Tests.TestPhoneNumber("12345");
        var doc = new omm.Serializer().toDocument(t1);
        expect(doc._id).toBe("tp1");
        expect(doc["phoneNumber"]["pn"]).toBe("12345");
    });
    it("deserializes basic objects", function () {
        var serializer = new omm.Serializer();
        var t1 = new Tests.TestPerson("tp1");
        t1.phoneNumber = new Tests.TestPhoneNumber("12345");
        var doc = serializer.toDocument(t1);
        var t1 = serializer.toObject(doc, undefined, Tests.TestPerson);
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
        var t1 = serializer.toObject(doc, undefined, Tests.TestTree);
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
    it("knows types ", function () {
        expect(omm.PersistenceAnnotation.getPropertyClass(Tests.TestPerson, "tree")).toBe(Tests.TestTree);
        expect(omm.PersistenceAnnotation.getPropertyClass(Tests.TestPerson, "leaf")).toBe(Tests.TestLeaf);
    });
    it("knows document names ", function () {
        expect(omm.PersistenceAnnotation.getDocumentPropertyName(Tests.TestLeaf, "greenNess")).toBe("greenIndex");
        expect(omm.PersistenceAnnotation.getObjectPropertyName(Tests.TestLeaf, "greenIndex")).toBe("greenNess");
    });
    it("can call functions that have are also webMethods normally", function (done) {
        Promise.cast(treeCollection.serverFunction("World", new Tests.TestTree(212), 42)).then(function (r) {
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
    it("can serialize object that have a parent object", function () {
        var tp = new Tests.TestTree(23);
        tp.grow();
        var serializer = new omm.Serializer();
        var doc = serializer.toDocument(tp);
        var tp2 = serializer.toObject(doc, undefined, Tests.TestTree);
        expect(tp2.getLeaves()[0].parent).toBeDefined();
        expect(tp2.getLeaves()[0].parent).toBe(tp2);
    });
    it("deserializes local objects", function () {
        var car = new Tests.TestCar();
        car.brand = "VW";
        car.wheel = new Tests.TestWheel();
        car.wheel.car = car;
        car.wheel.radius = 10;
        var s = new omm.Serializer();
        var document = s.toDocument(car);
        var otherCar = s.toObject(document, undefined, Tests.TestCar);
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
        var child2 = s.toObject(doc, undefined, Tests.TestInheritanceChild);
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
        debugger;
        var doc = s.toDocument(parent, true);
        console.log(doc);
        var parent2 = s.toObject(doc, undefined, Tests.TestInheritanceParent);
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
        var child2 = s.toObject(doc, undefined, Tests.TestInheritanceChild);
        expect(doc.ignoredOther).toBeUndefined();
        expect(child2.ignoredOther).toBeUndefined();
    });
    it("can do basic inserts", function (done) {
        treeCollection.newTree(20).then(function (tree) {
            expect(tree).toBeDefined();
            expect(tree instanceof Tests.TestTree).toBeTruthy();
            expect(tree.treeId).toBeDefined();
            expect(tree.getHeight()).toBe(20);
            return treeCollection.getById(tree.treeId);
        }).then(function (tree) {
            expect(tree).toBeDefined();
            expect(tree.treeId).toBeDefined();
            expect(tree.getHeight()).toBe(20);
            done();
        }).catch(function (ee) {
            fail(ee);
            done();
        });
    });
    it("updates the collection", function (done) {
        var id;
        personCollection.newPerson('bert').then(function (e) {
            id = e.getId();
            return e.collectionUpdateRename("klaus");
        }).then(function (n) {
            return personCollection.getById(id);
        }).then(function (p) {
            expect(p.getName()).toBe("Collection Update:klaus");
            done();
        }).catch(function (e) {
            fail(e);
            done();
        });
    });
    it("can save foreign keys in a map", function (done) {
        var personPromise = personCollection.newPerson("Held");
        var tree1Promise = treeCollection.newTree(13);
        var tree2Promise = treeCollection.newTree(12);
        Promise.all([tree1Promise, tree2Promise, personPromise]).then(function (values) {
            var t1 = values[0];
            var t2 = values[1];
            var held = values[2];
            var ap1 = held.addToWood(t1, "peterKey").then(function (r) {
                return r;
            });
            var ap2 = held.addToWood(t2, "klausKey").then(function (r) {
                return r;
            });
            return Promise.all([ap1, ap2]);
        }).then(function (arr) {
            return Promise.all([personPromise.then(function (held) {
                    return personCollection.getById(held.getId());
                }), tree1Promise]);
        }).then(function (arr) {
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
        treeCollection.newTree(20).then(function (t) {
            treeId = t.treeId;
        }).then(function () {
            return treeCollection.getById(treeId);
        }).then(function (t) {
            expect(t).toBeDefined();
            return treeCollection.deleteTree(treeId);
        }).then(function () {
            return treeCollection.getByIdOrFail(treeId).then(function (t) {
                fail("tree was still there");
                done();
            }).catch(function (reason) {
                done();
            });
        }).catch(function (reason) {
            fail(reason);
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
        var doc = s.toDocument(person, true);
        var person2 = s.toObject(doc, undefined, Tests.TestPerson);
        console.log(doc);
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
        }).then(function () {
            fail("did succeed");
            done();
        }).catch(function () {
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
        treeCollection.newTree(10).then(function () {
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
        var previousSizePromise = treeCollection.getAll().then(function (arr) {
            previousSize = arr.length;
        });
        previousSizePromise.then(function () {
            return treeCollection.newTree(10);
        }).then(function () {
            fail('false success');
            done();
        }).catch(function (err) {
            treeCollection.getAll().then(function (arr) {
                expect(arr.length).toBe(previousSize);
                done();
            });
        });
    });
    it("can handle thrown errors", function (done) {
        treeCollection.newTree(10).then(function (tree) {
            return tree.thisThrowsAnError();
        }).catch(function (err) {
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
        treeCollection.newTree(10).then(function (tree) {
            expect(tree).toBeDefined();
            return treeCollection.deleteTree(tree.treeId);
        }).then(function () {
            expect(l.listener).toHaveBeenCalled();
            done();
        });
    });
    it("trees have leaves", function (done) {
        var tId;
        treeCollection.newTree(10).then(function (t) {
            tId = t.treeId;
            expect(t).toBeDefined();
            return t.grow();
        }).then(function (values) {
            return treeCollection.getById(tId);
        }).then(function (t) {
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
        treeCollection.newTree(10).then(function (t) {
            expect(t).toBeDefined();
            tId = t.treeId;
            return t.grow();
        }).then(function (values) {
            return treeCollection.getById(tId);
        }).then(function (t) {
            expect(l.listener).not.toHaveBeenCalled();
            return t.getLeaves()[0].flutter();
        }).then(function () {
            expect(l.listener).toHaveBeenCalled();
            done();
        });
    });
    it("can receive emitted events from a subobject even if another (the first) event listener throws an exception", function (done) {
        var l = {};
        l.listener1 = function (event) {
            // throw "freekish error";
        };
        l.listener2 = function (event) {
        };
        spyOn(l, 'listener1').and.callThrough();
        spyOn(l, 'listener2').and.callThrough();
        omm.on(Tests.TestLeaf, "fluttering", l.listener1);
        omm.on(Tests.TestLeaf, "fluttering", l.listener2);
        var treePromise = treeCollection.newTree(10);
        var treeIdPromise = treePromise.then(function (t) {
            return t.treeId;
        });
        var growPromise = treePromise.then(function (t) {
            return t.grow();
        });
        var treePromise2 = Promise.all([growPromise, treeIdPromise]).then(function (values) {
            var treeId = values[1];
            return treeCollection.getById(treeId);
        });
        var flutterPromise = treePromise2.then(function (t) {
            return t.getLeaves()[0].flutter();
        }).then(function (t) {
            expect(l.listener1).toHaveBeenCalled();
            expect(l.listener2).toHaveBeenCalled();
            done();
        }).catch(function (e) {
            fail(e);
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
        treeCollection.newTree(10).then(function (t) {
            return Promise.cast(t.grow()).thenReturn(t);
        }).then(function (tree) {
            return treeCollection.getById(tree.treeId);
        }).then(function (tree2) {
            expect(l.listener).not.toHaveBeenCalled();
            return tree2.getLeaves()[0].flutter();
        }).then(function () {
            expect(l.listener).toHaveBeenCalled();
            done();
        });
    });
    //
    it("can return errors in a promise ", function (done) {
        treeCollection.errorMethod(10).then(function () {
            fail();
        }).catch(function (err) {
            expect(err).toBe("the error");
            done();
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
        treeCollection.newTree(10).then(function (tree) {
            treeId = tree.treeId;
            return treeCollection.deleteTree(tree.treeId);
        }).catch(function (error) {
            expect(error).toBe("nope");
            expect(l.listener).toHaveBeenCalled();
            treeCollection.getById(treeId).then(function (tree) {
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
        treeCollection.preUpdate(l.listener);
        var treePromise = treeCollection.newTree(10);
        treePromise.then(function (tree) {
            return Promise.all([tree.grow(), treePromise]);
            ;
        }).then(function (values) {
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
        treeCollection.preUpdate(l.listener);
        treeCollection.newTree(10).then(function (tree) {
            return tree.grow();
        }).catch(function (reason) {
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
        treeCollection.preUpdate(l.listener);
        var treePromise = treeCollection.newTree(10);
        treePromise.then(function (tree) {
            return Promise.all([tree.grow(), treePromise]);
        }).then(function (values) {
            return treeCollection.getById(values[1].treeId);
        }).then(function (tree) {
            return tree.getLeaves()[0].flutter();
        }).catch(function (err) {
            expect(err).toBe("not happening either");
            expect(l.listener).toHaveBeenCalled();
            done();
        });
    });
    function pit(s, f) {
        it(s, function (done) {
            var promise = f();
            promise.then(function () {
                done();
            }).catch(function (err) {
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
        treeCollection.onUpdate(l.listener);
        var treePromise = treeCollection.newTree(10);
        return treePromise.then(function (tree) {
            return Promise.all([tree.grow(), treePromise]);
        }).then(function (values) {
            return treeCollection.getById(values[1].treeId);
        }).then(function (tree) {
            expect(l.listener).toHaveBeenCalled();
            expect(tree.getLeaves().length).toBe(1);
        });
    });
    it("can cancel updates", function (done) {
        var l = {};
        l.listener = function (event) {
            event.cancel("nope");
        };
        spyOn(l, 'listener').and.callThrough();
        treeCollection.preUpdate(l.listener);
        var treeId;
        var treePromise = treeCollection.newTree(10);
        return treePromise.then(function (tree) {
            treeId = tree.treeId;
            return Promise.all([tree.grow(), treePromise]);
        }).catch(function (err) {
            expect(err).toBe("nope");
            treeCollection.getById(treeId).then(function (nt) {
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
        return treePromise.then(function (tree) {
            return Promise.all([tree.wither(), treePromise]);
        }).then(function (values) {
            return treeCollection.getById(values[1].treeId);
        }).then(function (tree) {
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
        treeCollection.newTree(10).then(function (t) {
            return t.wither();
        }).then(function () {
            expect(l.listener).toHaveBeenCalled();
            done();
        });
    });
    it("can load trees ", function (done) {
        treeCollection.newTree(20)
            .then(function (tree) {
            console.log("Tree id", tree.treeId);
            return client.load("TheTreeCollection", tree.treeId);
        })
            .then(function (tree) {
            expect(tree).toBeDefined();
            expect(tree instanceof Tests.TestTree).toBeTruthy();
            done();
        });
    });
    it("can load trees and call stuff on it", function (done) {
        var treeId;
        treeCollection.newTree(20)
            .then(function (tree) {
            console.log("Tree id", tree.treeId);
            treeId = tree.treeId;
            expect(tree.getHeight()).toBe(20);
            return client.load("TheTreeCollection", tree.treeId);
        })
            .then(function (tree) {
            expect(tree).toBeDefined();
            expect(tree.getHeight()).toBe(20);
            var growPromise = tree.grow();
            return growPromise;
        })
            .then(function (s) {
            return client.load("TheTreeCollection", treeId);
        })
            .then(function (tree) {
            expect(tree.getHeight()).toBe(21);
            done();
        });
    });
    it("transports user data when inserting", function (done) {
        var l = {};
        var n = [];
        client.setUserData({ user: "bert", foo: "bar", solution: 42 });
        l.listener = function (ctx, data) {
            expect(ctx.userData).toBeDefined();
            expect(ctx.userData.user).toBe("bert");
            expect(ctx.userData.solution).toBe(42);
        };
        spyOn(l, 'listener').and.callThrough();
        treeCollection.onInsert(l.listener);
        clientTreeService.insertTree(5).then(done, function (reason) {
            console.log("Failing because of ", reason);
            fail(reason);
            done();
        });
    });
    it("transports user data when updating", function (done) {
        var l = {};
        var n = [];
        client.setUserData({ user: "bert", foo: "bar", solution: 42 });
        l.listener = function (ctx, data) {
            expect(ctx.userData).toBeDefined();
            expect(ctx.userData.user).toBe("bert");
            expect(ctx.userData.solution).toBe(42);
        };
        spyOn(l, 'listener').and.callThrough();
        treeCollection.preUpdate(l.listener);
        clientTreeService.insertTree(5).then(function (t) {
            return t.grow();
        }).then(function () {
            expect(l.listener).toHaveBeenCalled();
        }).then(done);
    });
    it("transports function names and objects when updating", function (done) {
        var l = {};
        var n = [];
        client.setUserData({ user: "bert", foo: "bar", solution: 42 });
        l.listener = function (ctx, data) {
            expect(ctx.functionName).toBe('flutter');
            expect(ctx.object instanceof Tests.TestLeaf).toBeTruthy();
        };
        spyOn(l, 'listener').and.callThrough();
        var treeId;
        debugger;
        clientTreeService.insertTree(5).then(function (t) {
            treeId = t.treeId;
            return t.grow();
        }).then(function () {
            return client.load("TheTreeCollection", treeId);
        }).then(function (t) {
            treeCollection.preUpdate(l.listener);
            return t.getLeaves()[0].flutter();
        }).then(function () {
            expect(l.listener).toHaveBeenCalled();
        }).then(done).catch(function (reason) {
            fail(reason);
            done();
        });
    });
    it("eventlisteners return a promise", function (done) {
        var l = {};
        var n = [];
        client.setUserData({ user: "bert", foo: "bar", solution: 42 });
        l.listener = function (ctx, data) {
            expect(ctx.functionName).toBe('flutter');
            expect(ctx.object instanceof Tests.TestLeaf).toBeTruthy();
        };
        spyOn(l, 'listener').and.callThrough();
        var treeId;
        clientTreeService.insertTree(5).then(function (t) {
            treeId = t.treeId;
            return t.grow();
        }).then(function () {
            return client.load("TheTreeCollection", treeId);
        }).then(function (t) {
            treeCollection.preUpdate(l.listener);
            debugger;
            return t.getLeaves()[0].flutter();
        }).then(function () {
            expect(l.listener).toHaveBeenCalled();
        }).then(done);
    });
    it("doesnt reuse arrays in documents", function () {
        var tree = new Tests.TestTree(12);
        var serializer = new omm.Serializer();
        debugger;
        var doc = serializer.toDocument(tree);
        expect(tree.someArray.length).toBe(0);
        expect(doc.someArray).toBeDefined();
        expect(tree.someArray).not.toBe(doc.someArray);
        tree.someArray.push(42);
        expect(doc.someArray.length).toBe(0);
        var t2 = serializer.toObject(doc, undefined, Tests.TestTree);
        expect(t2.someArray).not.toBe(doc.someArray);
        doc.someArray.push(1200);
        expect(t2.someArray.length).toBe(0);
    });
    it("can serialize primitive data types", function () {
        var serializer = new omm.Serializer();
        var obj = serializer.toObject([42]);
        expect(Array.isArray(obj)).toBeTruthy();
        expect(obj.length).toBe(1);
        expect(obj[0]).toBe(42);
        var doc = serializer.toDocument([42]);
        expect(Array.isArray(doc)).toBeTruthy();
        expect(doc.length).toBe(1);
        expect(doc[0]).toBe(42);
    });
    it("returns the proper error", function (done) {
        treeCollection.getByIdOrFail('humbug').catch(function (reason) {
            expect(reason).toBeDefined();
            expect(reason.message).toBe("Not found");
            expect(reason instanceof Error).toBeTruthy();
            done();
        });
    });
    // test that calls a nested collection update (one in the other)
    // test that verifies that when en event cancells an operation with ctx.cancell(asdfasdf) its an instanceof Error that rejects the promise.
});
//# sourceMappingURL=Tests.spec.js.map