/**@flow
 * This module contains generic component widgets that can be assembled together to form larger parts.
 * 
 * Most components will be built with 3 functions:
 * - intent: reads from a DOM source to get events
 * - model(state): takes the event data and does something with the data
 * - view: writes a new DOM interface to be rendered 
 */
import { div, input, label, button, tr, td, span, makeDOMDriver } from "@cycle/dom";
import { run } from "@cycle/rxjs-run";
import Rx from "rxjs/Rx";
//const cockpit = require("cockpit");
//const _ = cockpit.gettext;
const _ = v => v;

function textInputIntent(input) {
    let dom$ = input.DOM;
    let label = dom$.select(".label");
    console.log(label);
    return label.events("input");
}

// What to do with the inputs
// TODO: Make this take another function which will be passed to map
function inputState(inpEvts: Rx.Observable) {
    return inpEvts.map(evt => {
        let value = evt.target.value;
        console.log(value);
        return value;
    }).startWith("Sean");
}

function TextInputView(state$: Rx.Observable) {
    return state$.map(s => {
        return div(".labeled-input",[
            label(".label", s),
            input(".input", {attrs: {type: "text"}})
        ]);
    })
}


export function makeTableRow(row: string, value: string) {
    return tr([
        td(".form-tr", _(row)),
        td([
            span(_)
        ])
    ])
    //return <tr key={row}><td className="form-tr-ct-title">{_(row)}</td><td><span>{value}</span></td></tr>
}

const drivers = {
    DOM: makeDOMDriver("#test")
}

function test(sources) {
    const intent$ = textInputIntent(sources);
    const model$ = inputState(intent$);
    const view$ = TextInputView(model$);

    return {
        DOM: view$
    }
}


run(test, drivers);