export interface DictNumber<T> {
    [id: number]: T | undefined;
}
export declare abstract class Dict<T> implements DictNumber<T> {
    [id: string]: T | undefined;
}
