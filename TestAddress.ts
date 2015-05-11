/**
 * Created by bert on 04.05.15.
 */
///<reference path="references.d.ts"/>

@persistence.PersistenceAnnotation.Entity
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