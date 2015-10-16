///<reference path="../../../../references.d.ts"/>

describe("The persistence thing on the client ", function(){
    var personCollection:Tests.TestPersonCollection;
    var treeCollection:Tests.TestTreeCollection;

    beforeEach(function(done){
        personCollection = new Tests.TestPersonCollection();
        treeCollection = new Tests.TestTreeCollection();
        console.log("------------------- new test");
        omm.Collection.resetAll(function(error){
            if (error)
                fail(error);
            done();
        });
    });


    it("can call wrapped functions", function(done){
        var c = 0;
        treeCollection.newTree(24,function(err:any,t:Tests.TestTree){
            c++;
            expect(c).toBe(1);
            omm.callHelper(t,function(err, result){
                c++;
                expect(c).toBe(2);
                expect(treeCollection.getById(t.treeId).getLeaves().length).toBe(1);
                expect(treeCollection.getById(t.treeId).getLeaves()[0] instanceof Tests.TestLeaf).toBeTruthy();
                done();
            }).grow();
        });
    });

    it("can call wrapped functions that return arrays of objects", function(done){
        var c = 0;
        treeCollection.newTree(24,function(err:any,t:Tests.TestTree){
            console.log("can call wrapped functions that return arrays of objects- tree created");
            c++;
            expect(c).toBe(1);
            omm.callHelper(t,function(err, result){
                console.log("can call wrapped functions that return arrays of objects- in call");
                c++;
                expect(c).toBe(2);
                expect(err).toBeUndefined();
                //expect( result ).toBeUndefined();
                //expect( Array.isArray(result) ).toBeTruthy();
                //expect( result.length ).toBeGreaterThan(0);
                //expect( !(result[0] instanceof Tests.TestLeaf) ).toBeFalsy(); // inverted to the potential error message is distinguishable
                done();
            }).growAndReturnLeaves();
        });
    });


    it("can return values from a wrapped function", function(done){
        personCollection.newPerson("Held", function(e:any, held:Tests.TestPerson) {
            omm.callHelper(held,function(err,a:Tests.TestAddress){
                expect( a instanceof Tests.TestAddress).toBeTruthy();
                expect( a.getStreet() ).toBe("streetsss");
                done();
            }).addAddress(new Tests.TestAddress("streetsss"));
        });
    });

    it("serializes and deserializes classes with a custom toDocument and toObject function properly", function(){
        var pn = new Tests.TestPhoneNumber("1212");
        var s = new omm.Serializer(new omm.ConstantObjectRetriever(1));
        var doc:any = s.toDocument(pn);
        expect( doc.freak ).toBe("show");
        expect( doc.pn ).toBe("1212");
        var ob = s.toObject(doc, Tests.TestPhoneNumber);
        expect( ob instanceof Tests.TestPhoneNumber ).toBeTruthy();

    });

    it("calls registered callbacks that receive results from the server ", function(done){
        treeCollection.newTree(24,function(err:any,t1:Tests.TestTree) {
            var s = omm.callHelper(t1,  function callback(error, result) {
                expect(result).toBe("grown on the server");
                done();
            }).grow();
            expect(s).toBeUndefined();
        });
    });

    it("can call wrapped functions on a subobject", function(done){
        personCollection.newPerson("bert", function(error:any, bert:Tests.TestPerson){
            expect(error).toBeFalsy();
            omm.callHelper(bert, function(){
                expect(personCollection.getById(bert.getId()).phoneBook["max"]).toBeDefined();
                omm.callHelper(personCollection.getById(bert.getId()).phoneBook["max"], function(err, result){
                    expect( result ).toBe("Calling a phone number : 1234567890");
                    expect(personCollection.getById(bert.getId()).phoneBook["max"]).toBeDefined();
                    done();
                }).callNumber();
            }).addPhoneNumber("max", new Tests.TestPhoneNumber("1234567890"));
        } );
    });

    it("does not lazy load objects within the same root object", function(done){
        personCollection.newPerson("Held", function(e:any, held:Tests.TestPerson){
            omm.callHelper(held, function(e,r){
                var loadedHeld = personCollection.getById(held.getId());
                expect(loadedHeld.getAddresses()[0]).toBeDefined();
                expect(omm.Serializer.needsLazyLoading(loadedHeld.getAddresses()[0], "person")).toBeFalsy();
                expect(loadedHeld.getAddresses()[0].person==loadedHeld).toBeTruthy();
                done();
            } ).addAddress(new Tests.TestAddress("streetname", held));
        });
    });

    it("is able to call methods that take and return arrays of entities", function(done){
        personCollection.newPerson("Held", function(e:any, held:Tests.TestPerson){
            omm.callHelper(held, function(e,r){
                var adrs:Array<Tests.TestAddress> = r;
                expect(e).toBeUndefined();
                expect(r).toBeDefined();
                expect(r.length).toBe(3);
                expect(r[0] instanceof Tests.TestAddress).toBeTruthy();
                expect(r[1] instanceof Tests.TestAddress).toBeTruthy();
                expect(r[2] instanceof Tests.TestAddress).toBeTruthy();
                expect( adrs[0].getStreet() ).toBe('streetname');
                expect( adrs[1].getStreet() ).toBe('streetname2');
                expect( adrs[2].getStreet() ).toBe('streetname3');
                done();
            } ).addAddresses([new Tests.TestAddress("streetname", held),new Tests.TestAddress("streetname2", held),new Tests.TestAddress("streetname3", held)]);
        });
    });

    it("lazy loads objects", function(done){
        personCollection.newPerson( "jake", function( error:any, jake:Tests.TestPerson ){
            treeCollection.newTree(12, function( error, t:Tests.TestTree ){
                omm.callHelper(jake,function(e,r){
                    var loadedJake = personCollection.getById(jake.getId());
                    expect(loadedJake).toBeDefined();
                    expect((<any>loadedJake)._tree).toBeDefined();
                    expect(omm.Serializer.needsLazyLoading(loadedJake, "tree") ).toBeTruthy();
                    expect(loadedJake.getTree() instanceof Tests.TestTree).toBeTruthy();
                    done();
                }).chooseTree(t);
            });
        });
    });

    it("calls methods exclusively on the server", function(done){
        personCollection.newPerson( "jake", function( error:any, jake:Tests.TestPerson ){
            jake.fromServer(function(error, r){
                expect(error).toBeUndefined();
                expect(r).toBe(true);
                done();
            });
        });
    });

    it("doesnt die if a wrapped call calls another wrapped call within a different collection", function(done){
        personCollection.newPerson("mike", function(e:any, p:Tests.TestPerson){
            treeCollection.newTree( 13, function(e:any, t:Tests.TestTree){
                omm.callHelper(p, function(){
                    omm.callHelper(personCollection.getById(p.getId()), function(err:any, result:number ){
                        expect(result).toBe(14); // tree grew on the server
                        expect(treeCollection.getById(t.treeId).getHeight()).toBe(13); // but that "growing" wasnt persited
                        done();
                    }).tendToGarden();
                }).chooseTree(t);
            });
        });
    });

    it("knows static meteor method annotations that have parameters", function(){
        var m:IMethodOptions = omm.PersistenceAnnotation.getMethodOptions('helloWorld');
        expect(m).toBeDefined();
        expect(m.name).toBe("helloWorld");
        expect(m.functionName).toBe('staticInsertPerson2');
        expect(m.isStatic).toBeTruthy();
        expect(m.object).toBe(Tests.TestPersonCollection);
        expect(m.parameterTypes[0]).toBe('string');
    });

    it("knows static meteor method annotations ", function(){
        var m:IMethodOptions = omm.PersistenceAnnotation.getMethodOptions('staticInsertPerson');
        expect(m).toBeDefined();
        expect(m.name).toBe("staticInsertPerson");
        expect(m.functionName).toBe('staticInsertPerson');
        expect(m.isStatic).toBeTruthy();
        expect(m.object).toBe(Tests.TestPersonCollection);
        expect(m.parameterTypes).toBeUndefined();
    });

    it("can insert a person using a call ", function(done){
        omm.call("insertPerson", 'hello', function(error,result:Tests.TestPerson){
            expect( result instanceof Tests.TestPerson ).toBeTruthy();
            expect( result.getName() ).toBe("hello");
            done();
        });
    });

    it("can insert a person using a call helper to a static function ", function(done){
        omm.staticCallHelper(Tests.TestPersonCollection,  function(error,result:Tests.TestPerson){
            expect( result instanceof Tests.TestPerson ).toBeTruthy();
            expect( result.getName() ).toBe("hello");
            done();
        }).staticInsertPerson("hello");
    });

    it("can insert a person using a call to a static function ", function(done){
        omm.call("staticInsertPerson", "hiho", function(error,result:Tests.TestPerson){
            expect( result instanceof Tests.TestPerson ).toBeTruthy();
            expect( result.getName() ).toBe("hiho");
            done();
        });
    });


    it("can insert a person using a helper ", function(done){
        omm.callHelper(personCollection, function(error,result){
            expect( result instanceof Tests.TestPerson ).toBeTruthy();
            done();
        }).insertPerson('hello');
    });

    it("can update a person using a helper ", function(done){
        omm.staticCallHelper(Tests.TestPersonCollection,  function(error,result:Tests.TestPerson){
            expect( error ).toBeUndefined();
            if( !error ){
                omm.callHelper(result, function(err,r2){
                    if( !err ) {
                        expect(err).toBeUndefined();
                        var n = personCollection.getById(result.getId());
                        expect(n.getName()).toBe("bert");
                    }
                    done();
                }).rename("bert");
            }
            else
                done();
        }).staticInsertPerson("hello");
    });

    it("can update a person using a meteor call ", function(done){
        omm.staticCallHelper(Tests.TestPersonCollection,  function(error,result:Tests.TestPerson){
            expect( error ).toBeUndefined();
            Meteor.call('rename', result.getId(), "max", function(err, res:string){
                expect(err).toBeUndefined();
                expect(res).toBe("max");
                expect(personCollection.getById(result.getId()).getName()).toBe("max");
                done();
            });
        }).staticInsertPerson("hello");
    });

    it("can handle null values ", function(done){
        omm.staticCallHelper(Tests.TestPersonCollection,  function(error,result:Tests.TestPerson){
            expect( error ).toBeUndefined();
            omm.callHelper( result ,function(e,r){
                expect( e ).toBeUndefined();
                expect(r).toBeNull();
                expect( personCollection.getById(result.getId()).getName() ).toBeNull();
                done();
            }).rename(null);
        }).staticInsertPerson("hello");
    });

    it("can handle null as values for a dictionary  ", function(done){
        omm.staticCallHelper(Tests.TestPersonCollection,  function(error,result:Tests.TestPerson){
            expect( error ).toBeUndefined();
            omm.callHelper( result ,function(e,r){
                expect( e ).toBeUndefined();
                expect( r ).toBeUndefined();
                expect( personCollection.getById(result.getId()).family['uncle'] ).toBeNull();
                done();
            }).addFamilyRelation("uncle", null);
        }).staticInsertPerson("hello");
    });

});