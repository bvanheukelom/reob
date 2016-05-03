///<reference path="../node_modules/omm/typings/jasmine/jasmine.d.ts"/>
///<reference path="../node_modules/omm/typings/meteor/meteor.d.ts"/>
"use strict";
var Tests_spec_1 = require("../node_modules/omm/spec/Tests.spec");
var ServerTests_spec_1 = require("../node_modules/omm/spec/ServerTests.spec");
var omm = require("../node_modules/omm/src/omm");
var Tests = require("../node_modules/omm/spec/classes/Tests");
console.log("servering");
Meteor.startup(function () {
    omm.config({
        Meteor: Meteor,
        Mongo: Mongo
    });
    omm.MeteorPersistence.init();
    Tests.TestPersonCollection.init();
    Tests.TestTreeCollection.init();
});
// this file is used to run the integration tests with the command
// meteor test --full-app --driver-package sanjo:jasmine
describe("Integration test server:", function () {
    ServerTests_spec_1.default();
    Tests_spec_1.default();
});
//# sourceMappingURL=ServerTests.app-tests.js.map