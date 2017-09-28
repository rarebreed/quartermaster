/**@flow
 * Contains unit tests for generic components
 */

import * as gen from "../../src/components/generic-view";
import { makeDOMDriver } from "@cycle/dom";
import { run } from "@cycle/rxjs-run";
import Rx from "rxjs/Rx";
import { getRhsmConf, setRhsmConf } from "../../src/lib/status";
//import { describe, it, expect } from "jasmine";
import { launch } from "../../src/lib/spawn";
import type { SpawnResult } from "../../src/lib/spawn";

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

describe("Cockpit API tests: ", function() {
    /**
     * replaces the good rhsm.conf with a known file for testing
     */
    beforeAll(runCmd(["cp", "/etc/rhsm/rhsm.conf", "/etc/rhsm/rhsm.conf.orig"]))

    xit("Tests the spawn command", (done) => {
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

    it("Gets the server.hostname in the rhsm.conf file", (done) => {
        let getPrm = getRhsmConf("server.hostname");
        let get$ = Rx.Observable.fromPromise(getPrm);
        get$.map(key => key)
          .subscribe(k => {
            expect(k.v).toBe("subscription.rhsm.redhat.com");
            done();
          })
    })

    it("Sets the server.hostname in rhsm.conf to foo.bar", (done) => {
        let newVal = "foo.bar";
        let setPrm = setRhsmConf("server.hostname", newVal, "s");
        let set$ = Rx.Observable.fromPromise(setPrm);
        set$
          .do(s => console.log(s))
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

    /**
    it("Creates a register socket with the RegisterServer interface", () => {

    })
    */

    // TODO: make an afteraAll function that will set the original rhsm.conf back 
    afterAll(runCmd(["mv", "/etc/rhsm/rhsm.conf.orig", "/etc/rhsm/rhsm.conf"]))
})

