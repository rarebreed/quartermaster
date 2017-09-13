/**@flow
 * This module contains generic component widgets that can be assembled together to form larger parts.
 * 
 * Most components will be built with 3 functions:
 * - intent: reads from a DOM source to get events
 * - model(state): takes the event data and does something with the data
 * - view: writes a new DOM interface to be rendered 
 * 
 * Conventions:
 * - The functions which create views (ie vdom elements) should be UpperCase
 * - Variables which are streams should end in $
 *   - A stream of streams:  multiStream$$
 */
import { div, input, label, button, tr, td, span, makeDOMDriver, DOMSource } from "@cycle/dom";
import { VNode } from "@cycle/dom";
import { run } from "@cycle/rxjs-run";
import Rx from "rxjs/Rx";
//const cockpit = require("cockpit");
//const _ = cockpit.gettext;
const _ = v => v;

type LabelInputProps = {
    name: string, 
    initial: string
}

type SliderInputProps = {
    label: LabelInputProps,
    min: number,
    max: number,
    unit: string
}

type LabelInputSources = {
    DOM: DOMSource,
    props$: Rx.Observable<LabelInputProps>
}

function textInputIntent(domSrc) {
    return domSrc.select(".label").events("input").map(evt => evt.target.value);
}

// What to do with the inputs
// TODO: Make this take another function which will be passed to map
function inputState(start: string, inpEvts: Rx.Observable) {
    return inpEvts.map(evt => {
        let value = evt.target.value;
        console.log(value);
        return value;
    }).startWith(start);
}

function textInputView(props$: Rx.Observable<LabelInputProps>, state$: Rx.Observable<string>) {
    // To bad rxjs doesn't have something like xstream's combine operator. combineAll is not the same
    props$.mergeMap(p => state$.map(s => 
            div(".labeled-input",[
                label(".label", s),
                input(".input", {attrs: {type: "text", defaultValue: p.initial}})
            ])
        )
    )
}

export function TextInput(sources: LabelInputSources) {
    const intent$ = textInputIntent(sources.DOM);
    const model$ = inputState("Sean", intent$);
    const view$ = textInputView(sources.props$, model$);

    return {
        DOM: view$
    }
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
    const props$ = Rx.Observable.of({name: "foo", initial: "Sean"});
    const tinput$ = TextInput({DOM: sources.DOM, props$: props$})

    return {
        DOM: tinput$
    }
}


run(test, drivers);