/**@flow
 * 
 */

const Rx = require("rxjs/Rx");

const props$ = Rx.Observable.of({name: "Sean", age: 45});
const fakeState$ = Rx.Observable.of("Hello");

function testing(p$, s$) {
    return p$.mergeMap(p => {
        return s$.map(s => {
            let ans = `${s} ${p.name}.  Your age is ${p.age}`;
            return ans;
        })
    })
}

const testme = testing(props$, fakeState$);
testme.subscribe(n => console.log(n));