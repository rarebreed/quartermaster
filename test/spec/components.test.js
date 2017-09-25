/**@flow
 * Contains unit tests for generic components
 */

import * as gen from "../../src/components/generic-view";
import { makeDOMDriver } from "@cycle/dom";
import { run } from "@cycle/rxjs-run";
import Rx from "rxjs/Rx";
import { getRhsmConf, setRhsmConf } from "../../src/lib/status";

function testFactory(Component) {
    return (sources) => {
        const comp = Component(val => val, sources.DOM);

        return {
            DOM: comp.DOM
        }
    }
}

/**
 * replaces the good rhsm.conf with a known file for testing
 */
function beforeAll() {
    // I think I need to use cockpit.spawn() and run a cp and mv command. 
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

describe("DBus RHSM Configuration tests: ", function() {
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
        let getPrm = getRhsmConf("server.hostname");
        let set$ = Rx.Observable.fromPromise(setPrm);
        let get$ = Rx.Observable.fromPromise(getPrm);
        set$.mergeMap(() => get$.map(k => k))
          .subscribe(res => {
              expect(res.v).toBe(newVal);
              done();
          });
    })
})

// TODO: make an afteraAll function that will set the original rhsm.conf back 
function afterAll() {

}