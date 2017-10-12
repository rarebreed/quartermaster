/**@flow
 * Examples that will run in a browser
 */
import Rx from "rxjs/Rx"
import { status } from "../../src/lib/status"
import { register, unregister, startRegister } from "../../src/lib/registration"
const cockpit = require("cockpit")

let status$ = status()
status$.subscribe({
    next: n => {
        console.log(`In main:  Status is now ${n.args[0]}`)
    },
    error: e => {
        console.error(`In main: Error getting status event`)
    }
})

let sock$ = startRegister()
let args$ = Rx.Observable.of({
    user: "stoner-cockpit",
    password: "quartermaster",
    org: "11348696",
    //host: "subscription.rhsm.stage.redhat.com",
    //port: "443"
})

status$.switchMap(s => {
    if (s.args[0] === 0) {
        console.log("Doing unregister")
        let unreg$ = unregister(Rx.Observable.of({}))
        return unreg$.map(r => {
            let v = {
                type: "unregister",
                result: r
            }
            return v
        })
    }
    else {
        console.log("Doing register")
        let register$ = register(sock$, args$)
        return register$.map(r => {
            let v = {
                type: "register",
                result: r
            }
            return v
        })
    }
}).subscribe({
    next: n => {
        console.log(`Result of ${n.type} was:`)
        console.log(n.result)
    },
    error: e => {
        console.log("Unable to perform (Un)register")
    },
    complete: () => console.log("Completed task")
})


