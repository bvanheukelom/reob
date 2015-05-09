/**
 * Created by bert on 04.05.15.
 */
import PersistenceAnnotation = require( "./PersistenceAnnotation" );


@PersistenceAnnotation.Entity
class TestAddress
{
    street:string;

    constructor( street:string)
    {
        this.street = street;
    }
    getStreet():string
    {
        return this.street;
    }
}

export = TestAddress;