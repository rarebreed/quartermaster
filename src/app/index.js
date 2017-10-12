//@flow
/**
 * This is the main entry point to our app
 * 
 *                                 /==> Listen for (Un)Register
 * Dbus Status => Create View ====|
 *                                 \==> Listen for Attach
 */

import Rx from "rxjs/Rx";
import { run } from '@cycle/run';
import { div, input, button, h1, hr, label, makeDOMDriver, DOMSource } from "@cycle/dom";
import {html} from 'snabbdom-jsx';
import { StatusView } from "../components/status-view.jsx";
import { TextInput } from "../components/generic-view";
import * as status from "../lib/status";
const cockpit = require("cockpit");
const Obs = Rx.Observable;


export type EntitlementStatus = "registered" | "unknown" | "registering" | "unregistering";


export type ProductDetails = {
    productName: string,
    productId: string,
    version: string,
    arch: "x86_64" | "aarch64" | "ppc64" | "ppc64le",
    status: string, // FIXME  This should be a union of strings
    starts: string, // FIXME:  This is probably a Time class of some sort
    ends: string    // FIXME: same as above
}


export function getStatus() {
    let stat = status.getStatus();
    return Obs.fromPromise(stat);
}


/**
 * Maintains the registration state in this stream
 * @param {*} action$ 
 */
function registerModel(action$: Rx.Observable) {
    return action$.map(e => {

    })
}

// ====================================================
// Entry point to our main app
// ====================================================
function main2(sources: DOMSource) {
    let status$ = getStatus();

    return {
        DOM: status$.map(s => StatusView(s))
    }
}

function main(sources: DOMSource) {
    let props$ = Rx.Observable.of({name: "Subscription", initial: "none"});
    let _src  = {DOM: sources.DOM, props$: props$};

    let status$ = getStatus().map(s => StatusView(s));
    let input$ = TextInput(_src)
    let inputDOM = input$.DOM;
    let inputValue = input$.value;

    // Merge the Status view with the TextInput view
    let vdom$ = status$.mergeMap(status => {
        return inputDOM.map(input => 
            div(".main", [
                status, 
                input
            ])
        )
    })
    
    return {
        DOM: vdom$
    }
}


run(main, {
    DOM: makeDOMDriver('#app')
})