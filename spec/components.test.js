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

function miniTest(Component, sources) {
    const comp = Component(sources.DOM);

    return {
        DOM: comp
    }
}

describe("Generic labeled input", function() {
    it("Verifies the component is created", function() {
        run(miniTest, drivers);

    })
})