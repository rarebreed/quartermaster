/**@flow
 * FP style functions
 */

export function id<T>(v: T): T {
    return v;
}

export const _ = id;

/**
 * Takes a function and curries it.  
 * 
 * If the passed in function takes multiple arguments, currier will create a new function which can be supplied less 
 * arguments.  If less args are supplied, it will continue returning a new function that takes the remainder of the 
 * functions required for invocation.  Once the required number of arguments are given, the original passed in function
 * will be invoked, and the stack of functions will be returned.
 * 
 * Since this is a recursive function, keep in mind the closures.  While no (sane) function should stack overflow using
 * this, it is theoretically possible if you accidentally pass in a function with a spread operator, and the thing you
 * spread is infinite like a generator (or very large).
 * 
 * Note that es is really stupid and does absolutely no enforcement of arity.  You can call an es function with more
 * args than it takes, and it will happily run it.  It will also happily run a function with less arguments than needed
 * (and implicitly give all the values of the args an undefined value).  To make it more stupid, the es6 default param
 * feature is not counted in the function.length property.  This means it is not possible to know how many arguments
 * a function in javascript takes if it uses default params.  Because of this, do not use currier on functions that use
 * default params.
 * 
 * The FP solution for defaulted params is a curried function!  Instead of doing this:
 * 
 * @example
 * function foo(x, y=10) {
 *  console.log(`${x} and ${y}`)
 * }
 * 
 * Do this
 * 
 * @example
 * function bar(y, x) {
 *   console.log(`${x} and ${y}`)
 * }
 * let bar2 = curry(bar, 10)
 * 
 * Note that the curried solution reverses the "defaulted" param.  Where default params are generally put at the end
 * of a function, in curried functions, you put args which are the most stable or set first, and the most variables args
 * last.  Generally speaking defaulted params are a code-smell.  If you find you have a common value to pass in, make 
 * your function have this as your first arg, and then curry it.  I noticed that ramdajs has the same probem with its
 * curry function.  So basically, don't use defaulted params
 * 
 * @param {Function} fn 
 * @param {Array<string>} collected 
 * @param {Array<string>} args 
 */
export function currier(fn: Function, collected: any[], ...args: any[]) {
    // Base Case: Check to see if what we've collected so far, plus the amount given by the rest of the args is enough
    if (collected.length + args.length >= fn.length) {
        let all = collected.concat(args)
        return fn(...all)
    }
    // Otherwise, collect the args given so far, and return a function which takes some amount of args and recurse.
    else {
        // While recursion here with let [args, ...more] = args for functional purity, the while loop is faster
        while (args.length !==0) {
            collected.push(args.shift())
        }
        return (...rest: any[]) => {
            return currier(fn, collected, ...rest)
        }
    }
}


export function curry(fn: Function, ...args: any[]) {
    return currier(fn, [], ...args)
}