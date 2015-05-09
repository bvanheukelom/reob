/**
 * Created by bert on 04.05.15.
 */

import PersistenceAnnotation = require( "./PersistenceAnnotation" );

declare class TestPerson {}

@PersistenceAnnotation.Entity
class TestPhoneNumber
{
    number:string;
    person:TestPerson;
    timesCalled:number=0;

    constructor(n:string, p:TestPerson)
    {
        this.number = n;
        this.person = p;
    }

    called():void
    {
        this.timesCalled++;
    }

    getNumber():string
    {
        return this.number;
    }
    getTimesCalled():number
    {
        return this.timesCalled;
    }
}

export = TestPhoneNumber