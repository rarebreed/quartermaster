/**@flow
 * FP style functions
 */

export function id<T>(v: T): T {
    return v;
}

export const _ = id;