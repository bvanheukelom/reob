/**
 * Created by bert on 09.05.15.
 */
///<reference path="references.d.ts"/>

import TestPerson = require("./TestPerson");
import BaseCollection = require("./BaseCollection");

class TestPersonCollection extends BaseCollection<TestPerson>
{
    constructor()
    {
        super(TestPerson);
    }
}

export  = TestPersonCollection;