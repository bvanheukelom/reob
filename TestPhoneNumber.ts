///<reference path="references.d.ts"/>

@persistence.PersistenceAnnotation.Entity
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
