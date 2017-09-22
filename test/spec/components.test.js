/**@flow
 * Contains unit tests for generic components
 */

import * as gen from "../../src/components/generic-view";
import { makeDOMDriver } from "@cycle/dom";
import { run } from "@cycle/rxjs-run";
import Rx from "rxjs/Rx";
import { getRhsmConf, setRhsmConf } from "../../src/lib/status";
//import { describe, it, expect } from "../jasmine/jasmine";

function testFactory(Component) {
    return (sources) => {
        const comp = Component(val => val, sources.DOM);

        return {
            DOM: comp.DOM
        }
    }
}

describe("Generic labeled input", function() {    
    it("Verifies the component is created", function() {
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
    })
})

describe("DBus RHSM Configuration tests: ", function() {
    it("Gets the server.hostname in the rhsm.conf file", function(done) {
        let getPrm = getRhsmConf("server.hostname");
        let get$ = Rx.Observable.fromPromise(getPrm);
        get$.map(key => key)
          .subscribe(k => {
            expect(k.v).toBe("subscription.rhsm.redhat.com");
            done();
          })
    })

    it("Sets the server.hostname in rhsm.conf to foo.bar", (done) => {
        let newVal = "subscription.rhsm.redhat.com";
        let setPrm = setRhsmConf("server.hostname", newVal, "s");
        let getPrm = getRhsmConf("server.hostname");
        let set$ = Rx.Observable.fromPromise(setPrm);
        let get$ = Rx.Observable.fromPromise(getPrm);
        set$.mergeMap(s => get$.map(k => k))
          .subscribe(res => {
              expect(res.v).toBe(newVal);
              done();
          });
    })
})