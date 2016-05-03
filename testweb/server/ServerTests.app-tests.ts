///<reference path="../node_modules/omm/typings/jasmine/jasmine.d.ts"/>
///<reference path="../node_modules/omm/typings/meteor/meteor.d.ts"/>

import TestsSpec from "../node_modules/omm/spec/Tests.spec"
import ServerSpec from "../node_modules/omm/spec/ServerTests.spec"
import * as omm from"../node_modules/omm/src/omm"


import * as Tests from "../node_modules/omm/spec/classes/Tests"

console.log("servering");

Meteor.startup(function(){
    omm.config({
        Meteor:Meteor,
        Mongo:Mongo
    });
    omm.MeteorPersistence.init();
    Tests.TestPersonCollection.init();
    Tests.TestTreeCollection.init();
});

// this file is used to run the integration tests with the command
// meteor test --full-app --driver-package sanjo:jasmine

describe("Integration test server:", function(){


    ServerSpec();
    TestsSpec();

});