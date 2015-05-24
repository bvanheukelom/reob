
module omm{
    // TODO rename to something that contains the word "Entity"
    export interface TypeClass<T> {
        new(): T ;
        toDocument?( o:T ):Document;
        toObject?( doc:Document ):T;
    }
}
