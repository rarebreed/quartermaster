/**@flow
 * Contains integration tests for:
 * - RHSM dbus services using the cockpit.dbus library
 * - Generic VDOM component tests
 * 
 * TODO: 
 * - Move all lambda functions inside it() to separate named functions
 * - Create a configuration system for the tests to define certain variables
 * - Create mocked versions of tests for unit testing or pseudo-integration testing
 * 
 * All of the lambda functions inside the it() functions need to become standalone named functions defined in
 * a separate library.  This is because we need to create a metadata decorator to create and upload Polarion testcases
 * 
 * There also needs to be a configuration system to read in variables for certain things.  For example passwords, or
 * settings to invoke in rhsm.conf, etc.
 */

import * as gen from "../../src/components/generic-view"
import { TextInput } from "../../src/components/generic-view"
import { makeDOMDriver } from "@cycle/dom"
import { run } from "@cycle/rxjs-run"
import isolate from "@cycle/isolate"
import Rx from "rxjs/Rx"
import { getRhsmConf, setRhsmConf, status } from "../../src/lib/status"
import { launch } from "../../src/lib/spawn"
import type { SpawnResult } from "../../src/lib/spawn"
import { startRegister, register, unregister } from "../../src/lib/registration"
import { ModalRegister } from "../../src/components/modal-register"
import { curry } from "../../src/lib/lambda"
import { setInput, runCmd } from "../lib/test-helpers"
import { RHSMDBus } from "../../src/lib/rhsm.dbus"
const cockpit = require("cockpit")

function testFactory(Component) {
    return (sources) => {
        const comp = Component(val => val, sources.DOM);

        return {
            DOM: comp.DOM
        }
    }
}

describe("Cockpit and RHSM Integration tests: ", function() {

    const domdriver = makeDOMDriver("#test")
    const status$ = status();
    status$.subscribe({
        next: n => {
            console.log(`In rhsm.test.js: Status is now ${JSON.stringify(n)}`)
        },
        error: err => {
            console.error(`In rhsm.test.js: Error occurred getting status`)
        }
    })


    xdescribe("Helper unit tests: ", () => {
        it("Tests the setInput", (done)=> {
            let inputElm = document.createElement("INPUT")
            inputElm.setAttribute("type", "text")
            inputElm.addEventListener("input", (ev) => {
                expect(ev.target.value).toBe("stoner")
                done()
            })

            setInput(Rx.Observable.of(inputElm), "stoner")
        })
    })


    xdescribe("Generic Component Tests: ", function() {    
        it("Verifies the component is created => ", function(done) {
            //let miniTest = testFactory(gen.TextInput)
            //run(miniTest, drivers);
            var comp;
            function main(sources) {
                let props$ = Rx.Observable.of({name: "Hello", initial: "World"});
                let srcs = { DOM: sources.DOM, props$: props$ }
                const GenericInp = isolate(TextInput, "generic")
                comp = GenericInp(srcs)

                return {
                    DOM: comp.DOM
                }
            }

            const drivers = {
                DOM: domdriver
            }

            const dispose = run(main, drivers)
            
            // Figure out why the isolate with "generic" doesn't work
            let inp = document.querySelector(".input")
            setInput(Rx.Observable.of(inp), "Gobbledegook")  // fill the Hello input with Sean
            if (comp)
                comp.value.do(res => console.log(`Value stream: ${res}`))
                .subscribe(v => {
                    expect(v).toBe("Gobbledegook")
                    done()
                })
            else 
                fail("Could not set generic input")
            //dispose()
            // TODO:  I think I need to do a document.querySelect here and expect the component to exist
        }, 30000)

        it("Verifies the ModalRegister", (done) => {
            function main(sources) {
                let domSrc = sources.DOM
                let view = ModalRegister(sources.DOM)

                // Programatically set our input values
                setInput(domSrc.select("login").elements(), "stoner-cockpit")
                setInput(domSrc.select("password").elements(), "quartermaster")
                setInput(domSrc.select("org").elements(), "")
                sources.DOM.select("#registration-btn").elements()
                    .map((me: HTMLButtonElement) => {
                        me.click()
                    })

                view.values.keys
            }

            const drivers = {
                DOM: domdriver
            }

            const dispose = run(main, drivers)
            done()
            dispose()
        })
    })

    xdescribe("RHSM Configuration DBus tests using cockpit => ", () => {
        /**
         * replaces the good rhsm.conf with a known file for testing
         */
        beforeEach(runCmd(["cp", "/etc/rhsm/rhsm.conf", "/etc/rhsm/rhsm.conf.orig"]))

        it("Gets the server.prefix in the rhsm.conf file", (done) => {
            console.debug("Running test to get server.prefix from rhsm.conf");
            let getPrm = getRhsmConf("server.prefix");
            let get$ = Rx.Observable.fromPromise(getPrm);
            get$.map(key => key)
                .subscribe(k => {
                    console.log(`In get, comparing ${k.v} to default`)
                    expect(k.v).toBe("/subscription");
                    done();
                })
        }, 60000)

        it("Sets the server.hostname in rhsm.conf to foo.bar", (done) => {
            console.debug("Running test to st server.hostname from rhsm.conf");
            let newVal = "foo.bar";
            let setPrm = setRhsmConf("server.hostname", newVal, "s");
            let set$ = Rx.Observable.fromPromise(setPrm);
            set$.do(s => console.log(`Doing the set ${s}`))
                .concatMap((s) => {
                    let getPrm = getRhsmConf("server.hostname");
                    let get$ = Rx.Observable.fromPromise(getPrm);
                    return get$.do(v => console.log(`From get$: ${v.v}`)).map(k => k)
                })
                .subscribe(res => {
                    console.log(`Comparing ${res.v} to ${newVal}`)
                    expect(res.v).toBe(newVal)
                    done()
                })
        }, 60000)

        // TODO: make an afteraAll function that will set the original rhsm.conf back 
        afterEach(runCmd(["mv", "/etc/rhsm/rhsm.conf.orig", "/etc/rhsm/rhsm.conf"]))

        // restart the rhsm.service
        afterAll(runCmd(["systemctl", "restart", "rhsm.service"]))
    })

    xdescribe("RHSM Entitlement status tests using cockpit => ", () => {
        var sub;
        it("Gets starting status of system", (done) => {
            console.debug("Starting status listener tests")
            sub = status$.subscribe({
                next: (stat) => {
                    console.log(`Status of system is: ${JSON.stringify(stat)}`)
                    expect(stat).toBeTruthy()
                    done()
                }
            })
        })

        afterEach(() => {
            if (sub) {
                console.log("Unregistering from status$ in status tests")
                sub.unsubscribe()
            }
        })
    })

    describe("RHSM Registration tests using cockpit => ", () => {
        var sub = status$.subscribe(s => {
            console.log(`In RHSM Registration: status is ${JSON.stringify(s)}`)
            //expect(s.args[0]).toBe(5)
            //done()
        })

        it("Tests the startRegister() function", (done) => {
            let service$ = startRegister()
            
        })

        xit("Unregisters with the dbus Unregister", (done) => {
            console.log("Start test of dbus Unregister method")
            let unregArgs$ = Rx.Observable.of({})
            let unreg$ = unregister(unregArgs$)
            let unregsub = unreg$.subscribe({
                next: res => {
                    expect(res).toBeTruthy()
                    console.log("After expect in unregister")
                    done()
                },
                error: err => {
                    console.error("Failed unregister")
                    fail()
                    done()
                }
            })
        }, 30000)

        it("Registers with the dbus Register method", (done) => {
            console.log("Start test of dbus Register method")
            let args$ = Rx.Observable.of({
                user: "stoner-cockpit",
                password: "quartermaster",
                org: "11348696",
                //host: "subscription.rhsm.stage.redhat.com",
                //port: "443"
            })
            let service$ = startRegister()
            let reg$ = register(service$, args$)
            let subscription = reg$.subscribe({
                next: (res) => {
                    console.log(res)
                    expect(res).toBeTruthy()
                    done()
                },
                error: (err) => {
                    fail("Test failed: Could not register")
                    done()
                }
            })
        }, 30000)

        xit("Unregisters with the RHSMDbus object", (done) => {
            console.debug("Start unregister with RHSMDBus")
            let svc = cockpit.dbus("com.redhat.RHSM1", {superuser: "require"})
            let proxy = svc.proxy("com.redhat.RHSM1.Unregister", "/com/redhat/RHSM1/Unregister")
            //let proxy = rhsmDBus.unregisterProxy
            sub = status$.subscribe({
                next: n => {
                    console.log(`In unregister status is now: ${JSON.stringify(n)}`)
                    expect(n.args[0]).toBe(5)
                    done()
                }
            })
            let pp = proxy.wait()
                .then(() => proxy.call("Unregister", [{}]))
                .then(() => "Successful unregistration")
                .catch(err => {
                    console.error(`Error with unregistration: ${JSON.stringify(err)}`)
                    return "Failed unregistration"
                })
        })
    })
})

