/**@flow
 * Contains unit tests for generic components
 */

import * as gen from "../src/components/generic-view";
import { makeDOMDriver } from "@cycle/dom";
import { run } from "@cycle/rxjs-run";
import Rx from "rxjs/Rx";
import { describe, it } from "../jasmine/jasmine";

const drivers = {
    DOM: makeDOMDriver("#test")
}

function testFactory(Component) {
    return (sources) => {
        const comp = Component(val => val, sources.DOM);

        return {
            DOM: comp
        }
    }
}

describe("Generic labeled input", function() {
    it("Verifies the component is created", function() {
        let miniTest = testFactory(gen.TextInput)
        run(miniTest, drivers);
    })
})