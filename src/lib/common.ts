﻿import { isEqual } from "./bf/bf";

export let typeOf: (x: any) => string = (x: any): string => {
    const s: string = typeof x;

    if (s === 'object') {
        if (x) {
            if (x instanceof Array) {
                return 'array';
            } else if (x instanceof Object) {
                return s;
            }

            const sClassName: string = Object.prototype.toString.call(x);

            if (sClassName === '[object Window]') {
                return 'object';
            }

            if ((sClassName === '[object Array]' ||
                (typeof x.length) === 'number' &&
                (typeof x.splice) !== 'undefined' &&
                (typeof x.propertyIsEnumerable) !== 'undefined' &&
                !x.propertyIsEnumerable('splice')

            )) {
                return 'array';
            }

            if ((sClassName === '[object Function]' ||
                (typeof x.call) !== 'undefined' &&
                (typeof x.propertyIsEnumerable) !== 'undefined' &&
                !x.propertyIsEnumerable('call'))) {
                return 'function';
            }
        } else {
            return 'null';
        }
    } else if (s === 'function' && (typeof x.call) === 'undefined') {
        return 'object';
    }

    return s;
};

export let isDef = (x: any): boolean => x !== undefined;
export let isDefAndNotNull = (x: any): boolean => x != null;
export let isEmpty = (x: any): boolean => x.length === 0;
export let isNull = (x: any): boolean => x === null;
export let isBoolean = (x: any): boolean => typeof x === 'boolean';
export let isString = (x: any): boolean => typeof x === 'string';
export let isNumber = (x: any): boolean => typeof x === 'number';
export let isFloat = isNumber;
export let isInt = (x: any): boolean => isNumber(x) && (~~x === x);
export let isUint = (x: any): boolean => isInt(x) && x > 0;
export let isFunction = (x: any): boolean => typeOf(x) === 'function';
export let isObject = (x: any): boolean => {
    const T: string = typeOf(x);
    return T === 'object' || T === 'array' || T === 'function';
};
export let isArrayBuffer = (x: any): boolean => x instanceof ArrayBuffer;
export let isTypedArray = (x: any): boolean => x !== null && typeof x === 'object' && typeof x.byteOffset === 'number';
export let isBlob = (x: any): boolean => x instanceof Blob;
export let isArray = (x: any): boolean => typeOf(x) === 'array';
export type INullable<T> = {[P in keyof T]: T[P] | null } | null;
