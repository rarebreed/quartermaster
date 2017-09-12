//@flow
/**
 * This is the main entry point to our app
 * 
 *                                 /==> Listen for (Un)Register
 * Dbus Status => Create View ====|
 *                                 \==> Listen for Attach
 */

import xs from "xstream";
import Rx from "rxjs/Rx";
import { run } from '@cycle/run';
import { div, input, button, h1, hr, label, makeDOMDriver } from "@cycle/dom";
import {html} from 'snabbdom-jsx';
import { StatusView } from "../components/status-view.jsx"
import * as status from "../lib/status";
const cockpit = require("cockpit");
const Obs = Rx.Observable;


type EntitlementStatus = "registered" | "unknown" | "registering" | "unregistering";


type ProductDetails = {
    productName: string,
    productId: string,
    version: string,
    arch: "x86_64" | "aarch64" | "ppc64" | "ppc64le",
    status: string, // FIXME  This should be a union of strings
    starts: string, // FIXME:  This is probably a Time class of some sort
    ends: string    // FIXME: same as above
}


function getStatus() {
    let stat = status.getStatus();
    return Obs.fromPromise(stat);
}

/**
 * Listens for action on the (Un)Register button
 * @param {*} domSource 
 */
function registrationIntent(domSource) {
    return domSource.select("#registration-btn")
      .events("click")
      .filter(evt => evt.button !== 2);
}

/**
 * Maintains the registration state in this stream
 * @param {*} action$ 
 */
function registerModel(action$: Rx.Observable) {
    return action$.map(e => {
        
    })
}


function main(sources) {
    let status$ = getStatus();
    return {
        DOM: status$.map(s => StatusView(s))
    }
}


run(main, {
    DOM: makeDOMDriver('#app')
})