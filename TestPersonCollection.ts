///<reference path="references.d.ts"/>
class TestPersonCollection extends persistence.BaseCollection<Tests.TestPerson>
{
    constructor()
    {
        super(Tests.TestPerson);
    }
}
