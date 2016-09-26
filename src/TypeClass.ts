/**
 * Created by bert on 23.09.16.
 */
export interface TypeClass<T> {
    new(...numbers: any[]): T ;
}