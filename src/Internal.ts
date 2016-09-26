/**
 * Created by bert on 23.09.16.
 */
/**
 * @private
 */
export function setNonEnumerableProperty(obj:Object, propertyName:string, value:any):void {
    if (!Object.getOwnPropertyDescriptor(obj, propertyName)) {
        Object.defineProperty(obj, propertyName, {
            configurable: false,
            enumerable: false,
            writable: true
        });
    }
    obj[propertyName] = value;
}

