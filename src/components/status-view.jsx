/** @flow @jsx html
 * Contains the DOM view of the status of the system
 * This includes if the system is registered or not, a (un)Register button, and a list of installed products
 */
import { html } from 'snabbdom-jsx';
import { div, label, button, p } from "@cycle/dom";
import { makeTableRow } from "./generic-view.js";
const cockpit = require("cockpit");
const _ = cockpit.gettext;

export type Status = "registered" | "unknown" | "registering" | "unregistering";

export const StatusView = (status: Status) => {
    let btnTxt = (status === "registered") ? "Register" : "Unregister";
    
    return (
        <div>
          <label>Status:</label>
          {` the system is ${status}`}
          <button id="register-btn">Register</button>
        </div>
    );
}

function statusView(status: Status) {
    let btnTxt = (status === "registered") ? "Register" : "Unregister";
    return div(".status-view", [
        label(".label", "Status: "),
        p(`The system status is ${status}`),
        button("#registration-btn", btnTxt)
    ])
}

export function installedProduct(rows: Array<Array<string>>) {
    return div("#installed-products", rows.map(r => {
        makeTableRow(r[0], r[1])
    }))
}


/**
 * Creates the Modal Register Dialog
 */
function RegisterView() {

}