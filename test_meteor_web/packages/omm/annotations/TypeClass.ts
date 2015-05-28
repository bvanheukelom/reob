
module omm{
    // TODO rename to something that contains the word "Entity"
    export interface TypeClass<T> {
        new(...some:any[]): T ;
        toDocument?( o:T ):Document;
        toObject?( doc:Document ):T;
    }
}
