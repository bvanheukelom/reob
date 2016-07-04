/**
 * Created by bert on 23.03.16.
 */

import * as omm from "../src/omm"
import * as Tests from "./classes/Tests"
import * as mongodb from "mongodb"
import * as Promise from "bluebird"
import * as wm from "@bvanheukelom/web-methods"


describe("Omm both on client and server", function () {

    var personCollection:Tests.TestPersonCollection;
    var treeCollection:Tests.TestTreeCollection;

    beforeAll((done)=>{
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000000;
        mongodb.MongoClient.connect('mongodb://localhost:27017/test',{promiseLibrary:Promise}).then((d:any)=>{
            var webMethods = new wm.WebMethods("http://localhost:7000/methods");
            omm.config({Mongo:{
                    collection:(n:string)=>d.collection(n),
                    ObjectID:mongodb.ObjectID
                },
                Meteor:{ isServer:false,
                    call:webMethods.call.bind(webMethods),
                    add:webMethods.add.bind(webMethods)
                }
            });
            omm.init();
            console.log("starting");
            webMethods.start(7000).then(()=>{
                done();

            });
        }).catch((err)=>{
            fail(err);
            done();
        });
    });

    beforeEach(function () {
        omm.removeAllUpdateEventListeners();
        personCollection = new Tests.TestPersonCollection();
        treeCollection = new Tests.TestTreeCollection();
    });

    function onlyOnce(f:Function):any {
        var counter = 0;
        return function () {
            if (counter > 0) {
                throw new Error("Function called twice");
            }
            counter = 1;
            f.apply(this, arguments);
        }
    }

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
        expect(omm.PersistenceAnnotation.getCollectionUpdateFunctionNames(Tests.TestPerson)).toBeDefined();
        expect(omm.PersistenceAnnotation.getCollectionUpdateFunctionNames(Tests.TestPerson)).toContain("collectionUpdateRename");
    });

    it("can clone stuff", function () {
        var t1:Tests.TestTree = new Tests.TestTree(10);
        t1.grow();
        var clone = omm.clone(t1);
        expect( clone instanceof Tests.TestTree ).toBeTruthy();
    });

    it("can do basic inserts", function (done) {
        treeCollection.newTree(20).then((tree:Tests.TestTree)=>{
            expect(tree).toBeDefined();
            expect((<any>tree)._serializationPath).toBeDefined();
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
        debugger;
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
            debugger;
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
            expect(held.wood["peterKey"].treeId).toBe(peter.treeId);
            done();
        });
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
        Promise.cast( treeCollection.serverFunction("World", new Tests.TestTree(212), 42) ).then((r)=>{
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
        var x:any = new f();
        x.hello(20);
        expect(x.c).toBe(21)
    });

    it("uses persistence paths to return undefined for non existent subobjects ", function () {
        var t1:Tests.TestTree = new Tests.TestTree(10);
        var pp:omm.SerializationPath = new omm.SerializationPath( "TestTree", "tree1");
        pp.appendArrayOrMapLookup("leaves", "nonexistentLeaf");
        expect(pp.getSubObject(t1)).toBeUndefined();
    });

    it("can do basic removes", function (done) {
        var treeId;
        debugger;
        treeCollection.newTree(20).then( ( t:Tests.TestTree) => {
            treeId = t.treeId;
        }).then(()=>{
            return treeCollection.getById(treeId);
        }).then(( t:Tests.TestTree )=>{
            expect( t ).toBeDefined();
            return treeCollection.deleteTree(treeId);
        }).then(()=>{
            return treeCollection.getById(treeId);
        }).then(( t:Tests.TestTree )=>{
            expect( t ).toBeUndefined();
            done();
        }).catch((err)=>{
            fail(err);
            done();
        });
    });
    // //
    it("uses persistence paths on root documents", function () {
        var t1:Tests.TestTree = new Tests.TestTree(123);
        t1.treeId = "tree1";
        t1.grow();
        omm.SerializationPath.updateSerializationPaths(t1);
        expect(t1["_serializationPath"]).toBeDefined();
        expect(t1["_serializationPath"].toString()).toBe("TheTreeCollection[tree1]");
    });

    it("uses persistence paths on sub documents", function () {
        debugger;
        var tp:Tests.TestPerson = new Tests.TestPerson("tp1");
        tp.phoneNumber = new Tests.TestPhoneNumber("12345");
        omm.SerializationPath.updateSerializationPaths(tp);
        expect(tp.phoneNumber["_serializationPath"]).toBeDefined();
        expect(tp.phoneNumber["_serializationPath"].toString()).toBe("TestPerson[tp1].phoneNumber");
    });
    //
    it("can call wrapped functions that are not part of a collection", function () {
        var t1:Tests.TestTree = new Tests.TestTree(10);
        t1.grow();
        expect(t1.getLeaves().length).toBe(1);
    });
    //
    it("uses persistence paths on subdocuments in arrays", function () {
        var t1:Tests.TestTree = new Tests.TestTree(10);
        t1.treeId = "tree1";
        t1.grow();
        omm.SerializationPath.updateSerializationPaths(t1);

        expect(t1.getLeaves().length).toBe(1);
        expect(t1.getLeaves()[0]["_serializationPath"]).toBeDefined();
        expect(t1.getLeaves()[0]["_serializationPath"].toString()).toBe("TheTreeCollection[tree1].leaves|leaf11");
    });
    //
    it("serializes basic objects", function () {
        var t1:Tests.TestPerson = new Tests.TestPerson("tp1");
        t1.phoneNumber = new Tests.TestPhoneNumber("12345");
        var doc = new omm.Serializer().toDocument(t1);
        expect(doc._id).toBe("tp1");
        expect(doc["phoneNumber"]["pn"]).toBe("12345");
    });
    // //
    it("deserializes basic objects", function () {
        var serializer:omm.Serializer = new omm.Serializer();
        var t1:Tests.TestPerson = new Tests.TestPerson("tp1");
        t1.phoneNumber = new Tests.TestPhoneNumber("12345");
        var doc = serializer.toDocument(t1);
        var t1:Tests.TestPerson = serializer.toObject(doc, Tests.TestPerson);
        expect(t1.getId()).toBe("tp1");
        expect(t1.phoneNumber instanceof Tests.TestPhoneNumber).toBeTruthy();
        expect(t1.phoneNumber.getNumber()).toBe("12345");
    });

    it("deserializes objects that have subobjects", function () {
        var serializer:omm.Serializer = new omm.Serializer();
        var t1:Tests.TestTree = new Tests.TestTree(123);
        t1.treeId = "t1";
        t1.grow();

        var doc = serializer.toDocument(t1);
        var t1:Tests.TestTree = serializer.toObject(doc, Tests.TestTree);
        expect(t1.treeId).toBe("t1");
        expect(t1.getLeaves()[0] instanceof Tests.TestLeaf).toBeTruthy();
    });

    it("deserializes objects that have document names", function () {
        var serializer:omm.Serializer = new omm.Serializer();
        var t1:Tests.TestTree = new Tests.TestTree(123);
        t1.treeId = "t1";
        t1.grow();
        var doc:any = serializer.toDocument(t1);
        expect(doc.thoseGreenThings[0].greenIndex).toBe(t1.getLeaves()[0].greenNess);
    });

    it("removes all", function () {
        // this test tests the before all thing
        expect(true).toBeTruthy();
    });
    //
    // //test that properties that need lazy loading are not loaded during serialization
    //
    // it("can use persistence paths on objects that have foreign key properties", function () {
    //     var t1:Tests.TestTree = new Tests.TestTree(12);
    //     t1.treeId = "dfdf";
    //     var tp:Tests.TestPerson = new Tests.TestPerson("tp");
    //     tp.tree = t1;
    //     new omm.MeteorObjectRetriever().updateSerializationPaths(tp);
    // });
    //
    // it("can serialize objects that have foreign key properties", function () {
    //     var t1:Tests.TestTree = new Tests.TestTree(122);
    //     t1.treeId = "tree1";
    //     var tp:Tests.TestPerson = new Tests.TestPerson("tp");
    //     tp.tree = t1;
    //     var doc = new omm.Serializer(new omm.MeteorObjectRetriever()).toDocument(tp);
    //     expect(doc["tree"]).toBe("TheTreeCollection[tree1]");
    // });
    //
    // it("can save objects that have foreign key properties", function (done) {
    //     var c = 0;
    //     personCollection.newPerson("jake").then( (jake:Tests.TestPerson) =>{
    //         c++;
    //         expect(c).toBe(1);
    //         expect(jake).toBeDefined();
    //         treeCollection.newTree(12, function (error, t:Tests.TestTree) {
    //             c++;
    //             expect(c).toBe(2);
    //             jake.chooseTree(t);
    //             var loadedJake = personCollection.getById(jake.getId());
    //             expect(loadedJake).toBeDefined();
    //             expect(loadedJake.tree).toBeDefined();
    //             done();
    //         });
    //     }).catch((err)=>{
    //         fail();
    //         done();
    //     });
    // });
    // //
    // //
    // it("can save objects that have subobjects which are subobjects of other root objects", function (done) {
    //     var c = 0;
    //     treeCollection.newTree(10, function (err, t:Tests.TestTree) {
    //         c++;
    //         expect(c).toBe(1);
    //         //expect(t).toBeDefined();
    //         t.grow();
    //         personCollection.newPerson("girl").then((tp:Tests.TestPerson) =>{
    //             c++;
    //             if (c != 2)
    //                 debugger;
    //             expect(c).toBe(2);
    //             omm.callHelper(tp, function (err, res) {
    //                 omm.callHelper(tp, function (err, res) {
    //                     expect(personCollection.getById(tp.getId()).leaf).toBeDefined();
    //                     expect(personCollection.getById(tp.getId()).leaf.getId() + "!").toBe(treeCollection.getById(t.treeId).getLeaves()[0].getId() + "!");
    //                     done();
    //                 }).collectLeaf();
    //             }).chooseTree(t);
    //
    //         });
    //     });
    // });
    // //
    // it("can save objects that have subobjects which are one of many elements in a subobject-array of another root object", function (done) {
    //     var c = 0;
    //     treeCollection.newTree(10, function (err, t1:Tests.TestTree) {
    //         c++;
    //         if (c > 1)
    //             fail();
    //         //expect(t1).toBeDefined();
    //         for (var i = 0; i < 5; i++)
    //             treeCollection.getById(t1.treeId).grow();
    //         t1 = treeCollection.getById(t1.treeId);
    //         expect(t1.getLeaves().length).toBe(5);
    //         personCollection.newPerson("girl").then((tp:Tests.TestPerson) =>{
    //             c++;
    //             if (c > 2)
    //                 fail();
    //             expect(t1.getLeaves()[3]).toBeDefined();
    //             tp.chooseLeaf(t1.getLeaves()[3]);
    //             expect(personCollection.getById(tp.getId()).leaf).toBeDefined();
    //             //expect(personCollection.getById(tp.getId()).leaf.getId()).toBe(t1.getLeaves()[5].getId());
    //             //expect(personCollection.getById(tp.getId()).leaf.greenNess).toBe(t1.getLeaves()[5].greenNess);
    //             done();
    //         });
    //     });
    //
    // });
    //
    //
    it("serializes objects to plain objects", function () {
        var tp = new Tests.TestPerson("tp");
        tp.tree = new Tests.TestTree(12);
        var serializer = new omm.Serializer();
        var doc:any = serializer.toDocument(tp);

        expect(doc.tree instanceof Tests.TestTree).toBeFalsy();
    });
    //
    //
    it("can serialize object in a map", function () {
        var tp = new Tests.TestPerson("tp");
        tp.phoneBook["klaus"] = new Tests.TestPhoneNumber("121212");
        var serializer = new omm.Serializer();
        var doc:any = serializer.toDocument(tp);

        expect(doc).toBeDefined();
        expect(doc.phoneBook).toBeDefined();
        expect(doc.phoneBook["klaus"]).toBeDefined();
        expect(doc.phoneBook["klaus"].pn).toBeDefined();
    });
    //
    // it("can serialize object in a map as foreign key", function (done) {
    //     treeCollection.newTree(12, function (e:any, klaus:Tests.TestTree) {
    //         treeCollection.newTree(13, function (e:any, peter:Tests.TestTree) {
    //             personCollection.newPerson("Held").then((held:Tests.TestPerson) =>{
    //                 held.addToWood(klaus, "xxx");
    //                 held.addToWood(peter, "yyy");
    //                 held = personCollection.getById(held.getId());
    //                 var doc:any = new omm.Serializer(new omm.MeteorObjectRetriever()).toDocument(held);
    //                 expect(doc).toBeDefined();
    //                 expect(doc.wood).toBeDefined();
    //                 expect(doc.wood["xxx"]).toBeDefined();
    //                 expect(doc.wood["xxx"]).toBe("TheTreeCollection[" + klaus.treeId + "]");
    //                 expect(doc.wood["yyy"]).toBe("TheTreeCollection[" + peter.treeId + "]");
    //                 done();
    //             });
    //         });
    //     });
    // });
    //
    // //

    // //xxx
    // it("can save objects with a dictionary to objects in the same collection", function (done) {
    //     Promise.all( [personCollection.newPerson("mom"),personCollection.newPerson("dad")] ).then((parents:Array<Tests.TestPerson>) =>{
    //         var mom = parents[0];
    //         var dad = parents[1];
    //         personCollection.haveBaby(mom, dad ).then( (kid:Tests.TestPerson) => {
    //             expect(personCollection.getById(kid.getId()).family["mom"].getId()).toBe(mom.getId());
    //             expect(personCollection.getById(kid.getId()).family["dad"].getId()).toBe(dad.getId());
    //             done();
    //         });
    //     });
    // });
    // //
    // //
    //
    // //
    // it("stores something as a foreign key turns undefined after the foreign object is deleted", function (done) {
    //     Promise.all( [personCollection.newPerson("mom"),personCollection.newPerson("dad")] ).then((parents:Array<Tests.TestPerson>) =>{
    //         var mom = parents[0];
    //         var dad = parents[1];
    //         personCollection.haveBaby(mom, dad ).then( (kid:Tests.TestPerson) => {
    //             expect(personCollection.getById(kid.getId()).family["mom"].getId()).toBe(mom.getId());
    //             expect(personCollection.getById(kid.getId()).family["dad"].getId()).toBe(dad.getId());
    //             personCollection.removePerson(mom.getId()).then(()=>{
    //                 expect(personCollection.getById(kid.getId()).family["mom"]).toBeUndefined();
    //                 done();
    //             });
    //         });
    //     });
    //
    // });
    //
    //
    it("serializes the classname of unexpected objects", function () {
        var t:Tests.TestPerson = new Tests.TestPerson("id1", "jake");
        t.addresses.push(<any>new Tests.TestLeaf("leafId1"));
        var doc = new omm.Serializer().toDocument(t);
        expect(doc["addresses"][0].className).toBe("TestLeaf");
        expect(doc["addresses"][0]._id).toBe("leafId1");
    });
    //
    it("deserializes unexpected objects", function () {
        var t:Tests.TestPerson = new Tests.TestPerson("id1", "jake");
        t.addresses.push(<any>new Tests.TestLeaf("leafId1"));
        var s = new omm.Serializer();
        var doc = s.toDocument(t);
        var o:any = s.toObject(doc, Tests.TestPerson);
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
        var s:omm.Serializer = new omm.Serializer();
        var document:any = s.toDocument(car);
        var otherCar = s.toObject(document, Tests.TestCar);
        var doc:any = s.toDocument(otherCar);

        expect(doc).toBeDefined();
        expect(doc.brand).toBe("VW");
        expect(doc.wheel.radius).toBe(10);
        expect(doc instanceof Tests.TestCar).toBeFalsy();

        // also there are no added properties in there
        for (var propertyName in otherCar) {
            expect(["wheel", "wheels", "brand"].indexOf(propertyName) != -1).toBeTruthy();
        }
    });
    //
    it("serializes local objects", function () {
        var car = new Tests.TestCar();
        car.brand = "VW";
        car.wheel = new Tests.TestWheel();
        car.wheel.car = car;
        car.wheel.radius = 10;
        var s:omm.Serializer = new omm.Serializer();
        var doc:any = s.toDocument(car);
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
        var s:omm.Serializer = new omm.Serializer();
        var doc:any = s.toDocument(car);
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
        var s:omm.Serializer = new omm.Serializer();
        var doc:any = s.toDocument(car);
        expect(doc).toBeDefined();
        expect(doc.wheels).toBeDefined();
        expect(doc.wheels.length).toBe(4);
    });
    //
    it("serializes local objects with arrays", function () {
        var s:omm.Serializer = new omm.Serializer();
        var otherCar:Tests.TestCar = s.toObject({
            brand: "Monster",
            wheels: [{}, {}, {}, {radius: 12}]
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
        var s:omm.Serializer = new omm.Serializer();
        var child:Tests.TestInheritanceChild = new Tests.TestInheritanceChild();
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
        var s:omm.Serializer = new omm.Serializer();
        var parent:Tests.TestInheritanceParent = new Tests.TestInheritanceParent();
        parent.parentOther = new Tests.TestInheritanceOther();
        parent.parentOther.name = "Groundhog";
        parent.parentOther.otherness = 84;
        var doc:any = s.toDocument(parent);
        var parent2 = s.toObject(doc, Tests.TestInheritanceParent);
        expect(parent2.parentOther instanceof Tests.TestInheritanceOther).toBeTruthy();
        expect(doc.parentOther instanceof Tests.TestInheritanceOther).toBeFalsy();
    });
    //
    it("ignores properties that need to be ignored on parent properties", function () {
        var s:omm.Serializer = new omm.Serializer();
        var child:Tests.TestInheritanceChild = new Tests.TestInheritanceChild();
        child.ignoredOther = new Tests.TestInheritanceOther();
        child.ignoredOther.name = "I need to be ignored";
        child.parentOther = new Tests.TestInheritanceOther();
        child.parentOther.name = "Groundhog";
        child.parentOther.otherness = 84;
        var doc:any = s.toDocument(child);
        var child2 = s.toObject(doc, Tests.TestInheritanceChild);
        expect(doc.ignoredOther).toBeUndefined();
        expect(child2.ignoredOther).toBeUndefined();
    });
    //
    // it("stores properties as keys that need to be stores as key on parent properties", function () {
    //     var s = new omm.Serializer(new omm.MeteorObjectRetriever());
    //     var child:Tests.TestInheritanceChild = new Tests.TestInheritanceChild();
    //     child.person = new Tests.TestPerson('p1', 'pete');
    //     var doc:any = s.toDocument(child);
    //     expect(typeof doc.person).toBe("string");
    // });
    //
    it("deserializes objects of different classes in an array", function () {
        var s:omm.Serializer = new omm.Serializer();
        var person:Tests.TestPerson = new Tests.TestPerson('p1', 'pete');
        var child:Tests.TestInheritanceChild = new Tests.TestInheritanceChild();
        var wheel:Tests.TestWheel = new Tests.TestWheel();
        var car:Tests.TestCar = new Tests.TestCar();
        person.addresses.push(<any>child);
        person.addresses.push(<any>wheel);
        person.addresses.push(<any>car);
        var doc:any = s.toDocument(person);
        var person2 = s.toObject(doc, Tests.TestPerson);

        expect(person2.addresses[0] instanceof Tests.TestInheritanceChild).toBeTruthy();
        expect(person2.addresses[1] instanceof Tests.TestWheel).toBeTruthy();
        expect(person2.addresses[2] instanceof Tests.TestCar).toBeTruthy();
    });


    it("can get the testwheel class by its configured name", function () {
        var p = omm.PersistenceAnnotation.getEntityClassByName("TestWheelBanzai")
        expect(p).toBeDefined();
        expect(p).toBe(Tests.TestWheel);
    });

    it("can get the testCar class by its name", function () {
        var p = omm.PersistenceAnnotation.getEntityClassByName("TestCar");
        expect(p).toBeDefined();
        expect(p).toBe(Tests.TestCar);
    });




    //
    //    // test for omm.PersistenceAnnotation.getPropertyClass(omm.entityClasses["TestCar"], "wheels")
    //
    //    // test regarding a number as an id property
    //
    //    // test regarding a different property than the _id property as the id property
    //
    //    // test that shows that root entities can be passed as parameters
    //
    //    // test that shows that entities can be passed as parameters
    //
    //    // test that shows that the subobjectpath class can handle array index lookups
    //
    //
});
