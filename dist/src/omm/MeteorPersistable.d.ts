/**
 * Created by bert on 22.03.16.
 */
import { SerializationPath } from "./SerializationPath";
export interface MeteorPersistable {
    _serializationPath?: SerializationPath;
}
