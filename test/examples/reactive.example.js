/**@flow
 * Examples that will run in a browser
 */
import Rx from "rxjs/Rx"
import { status, testMakeEventState } from "../../src/lib/status"
import { register, unregister, startRegister } from "../../src/lib/registration"
import type { RegisterArgs } from "quartermaster"
//const cockpit = require("cockpit")


function makeRegistrationStream( stat$: Rx.Observable<string>
                               , socket$: Rx.Observable<string>
                               , args$: Rx.Observable<RegisterArgs>) {
    return stat$.switchMap(s => {
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
            let register$ = register(socket$, args$)
            return register$.map(r => {
                let v = {
                    type: "register",
                    result: r
                }
                return v
            })
        }
    })
}

function registration(reg$: Rx.Observable<{type: string, result: string}>) {
    reg$.subscribe({
        next: n => {
            console.log(`Result of ${n.type} was:`)
            console.log(n.result)
        },
        error: e => {
            console.log("Unable to perform (Un)register")
        },
        complete: () => console.log("Completed task")
    })
}

//function testMain() {
let status$ = status()
status$.subscribe({
    next: n => {
        console.log(`In main:  Status is now ${n.args[0]}`)
    },
    error: e => {
        console.error(`In main: Error getting status event`)
    }
})

//testMakeEventState()

let sock$ = startRegister()
let args$: RegisterArgs  = Rx.Observable.of({
    user: "stoner-cockpit",
    password: "quartermaster",
    org: "11348696",
    //host: "subscription.rhsm.stage.redhat.com",
    //port: "443"
})

let reg$ = makeRegistrationStream(status$, sock$, args$)
registration(reg$)
//}
//let reg2$ = makeRegistrationStream(status$, sock$, args$)
//registration(reg2$)

