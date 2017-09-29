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

import * as gen from "../../src/components/generic-view";
import { makeDOMDriver } from "@cycle/dom";
import { run } from "@cycle/rxjs-run";
import Rx from "rxjs/Rx";
import { getRhsmConf, setRhsmConf, status } from "../../src/lib/status";
import { launch } from "../../src/lib/spawn";
import type { SpawnResult } from "../../src/lib/spawn";
import { startRegister, register } from "../../src/lib/registration";
//import { describe, it, beforeEach, afterEach, expect } from "jasmine";

function testFactory(Component) {
    return (sources) => {
        const comp = Component(val => val, sources.DOM);

        return {
            DOM: comp.DOM
        }
    }
}

const runCmd = cmd => done => {
    console.log(`Running ${cmd.join(" ")}`)
    let { result$, output$ } = launch(cmd)
    output$.subscribe(console.log)
    result$.subscribe({
        next: (res: SpawnResult) => {
            console.log(res)
            done()
        },
        error: (err: SpawnResult) => console.error(err),
        complete: () => console.log("Process completed")
    })
}

describe("Generic labeled input: ", function() {    
    it("Verifies the component is created", function(done) {
        //let miniTest = testFactory(gen.TextInput)
        //run(miniTest, drivers);
        function main(sources) {
            let props$ = Rx.Observable.of({name: "Hello", initial: "World"});
            let srcs = { DOM: sources.DOM, props$: props$ }
            const comp = gen.TextInput(val => val, srcs);
            return {
                DOM: comp.DOM
            }
        }

        const drivers = {
            DOM: makeDOMDriver("#test")
        }

        run(main, drivers);
        done();
        // TODO:  I think I need to do a document.querySelect here and expect the component to exist
    })
})

describe("Cockpit and RHSM Integration tests: ", function() {

    describe("Cockpit API tests => ", () => {
        it("Tests the spawn command", (done) => {
            // I think I need to use cockpit.spawn() and run a cp and mv command. 
            let {result$, output$} = launch(["ls", "-al", "/home/stoner"]);
            output$.subscribe(console.log);
            result$.subscribe({
                next: (res: SpawnResult) => {
                    console.log(res);
                    expect(res.exit_status).toBe(0);
                    done();
                },
                error: (err: SpawnResult) => console.error(err)
            })
        }) 
    })

    describe("RHSM Configuration DBus tests using cockpit => ", () => {
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
        })

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
        })

        // TODO: make an afteraAll function that will set the original rhsm.conf back 
        afterEach(runCmd(["mv", "/etc/rhsm/rhsm.conf.orig", "/etc/rhsm/rhsm.conf"]))
    })

    describe("RHSM Entitlement status tests using cockpit => ", () => {

        it("Gets starting status of system", (done) => {
            let status$ = status();
            status$.subscribe({
                next: (stat) => {
                    console.log(stat)
                    expect(stat).toBeTruthy()
                    done()
                }
            })
        })
    })

    describe("RHSM Registration tests using cockpit => ", () => {
        it("Registers with the dbus Register method", (done) => {
            let args$ = Rx.Observable.of({
                user: "stoner-cockpit",
                password: "quartermaster",
                org: "11348696",
                host: "subscription.rhsm.stage.redhat.com",
                port: "443"
            })
            let service$ = startRegister()
            register(service$, args$).subscribe({
                next: (res) => {
                    expect(res).toBeTruthy()
                    done()
                },
                error: (err) => {
                    fail("Could not register")
                    done()
                }
            })
        }, 300000)
    })
})

