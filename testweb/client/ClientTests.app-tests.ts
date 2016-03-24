///<reference path="../node_modules/omm/typings/jasmine/jasmine.d.ts"/>

import TestsSpec from "../node_modules/omm/spec/Tests.spec"
import ClientSpec from "../node_modules/omm/spec/ClientTests.spec"
import * as omm from "omm"
import * as Tests from "../node_modules/omm/spec/classes/Tests"

// this file is used to run the integration tests with the command
// meteor test --driver-package sanjo:jasmine

Meteor.startup(function(){
    omm.config({
        Meteor:Meteor,
        Mongo:Mongo
    });
    omm.MeteorPersistence.init();
    Tests.TestPersonCollection.init();
    Tests.TestTreeCollection.init();
});

describe("Integration test client :", function(){

    ClientSpec();
    TestsSpec();

});