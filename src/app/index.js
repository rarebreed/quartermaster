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
import * as status from "../dbus/status";
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


function getStatus(init: string) {
    let stat = status.getStatus();
    return Obs.fromPromise(stat);
}


function sView(status: EntitlementStatus) {
    return div([
                label([`Status: the system is ${status}`]),
                button("register-btn", "Register")
            ])
}


function main(sources) {
    // TODO: Replace with entitlement status dbus method
    let status$ = getStatus("unregistering");
    return {
        DOM: status$.map(s => StatusView(s))
    }
}


run(main, {
    DOM: makeDOMDriver('#app')
})