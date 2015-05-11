///<reference path="references.d.ts"/>

class TestPersonCollection extends persistence.BaseCollection<TestPerson>
{
    constructor()
    {
        super(TestPerson);
    }
}
