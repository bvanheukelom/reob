///<reference path="../../typings/jasmine/jasmine.d.ts"/>
"use strict";
var Tests_spec_1 = require("../node_modules/omm/spec/Tests.spec");
var ClientTests_spec_1 = require("../node_modules/omm/spec/ClientTests.spec");
var omm = require("omm");
var Tests = require("../node_modules/omm/spec/classes/Tests");
// this file is used to run the integration tests with the command
// meteor test --driver-package sanjo:jasmine
Meteor.startup(function () {
    omm.config({
        Meteor: Meteor,
        Mongo: Mongo
    });
    omm.MeteorPersistence.init();
    Tests.TestPersonCollection.init();
    Tests.TestTreeCollection.init();
});
describe("Integration test client :", function () {
    ClientTests_spec_1.default();
    Tests_spec_1.default();
});
//# sourceMappingURL=ClientTests.app-tests.js.map