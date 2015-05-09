/**
 * Created by bert on 04.05.15.
 */

import PersistenceAnnotation = require( "./PersistenceAnnotation" );

declare class TestPerson {}

@PersistenceAnnotation.Entity
class TestPhoneNumber
{
    number:string;

    constructor(n:string)
    {
        this.number = n;
    }
    getNumber():string
    {
        return this.number;
    }
}

export = TestPhoneNumber