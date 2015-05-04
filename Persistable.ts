/**
 * Created by bert on 04.05.15.
 */
interface Persistable
{
    getId():string;
    toDocument?():Document;
}
export = Persistable;