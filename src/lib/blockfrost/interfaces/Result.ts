import { BlockfrostError } from './Error';

export interface BlockfrostResult<T> {
    data?: T;
    error?: BlockfrostError;
}
