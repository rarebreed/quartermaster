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
//import xs, { Stream, MemoryStream } from "xstream";
//import { run } from "@cycle/run";
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
    return domSrc.select(".input")
      .events("input")
      .map(evt => evt.target.value);
}


function inputState(fn: (v: string) => any,inpEvts: any) {
    return inpEvts.map(fn)
      .startWith("");
}

/**
 * Creates the actual DOM component for the labeled input
 * 
 * FIXME:  Everytime someone enters text in the field, the div will be redrawn which seems like a performance waste.
 * 
 * @param {*} props$ 
 * @param {*} state$ 
 */
function textInputView(props$: Rx.Observable<LabelInputProps>, state$: Rx.Observable<string>) {
    // I couldn't find an equivalent of xstream's combine operator in rxjs.  But this should do what I want
    return props$.do(i => console.log(i)).mergeMap(p => {
        return state$.map(s => 
            div(".labeled-input",[
                label(".label", p.name),
                input(".input", {attrs: {type: "text", defaultValue: p.initial}})
            ])
        )
    })
}

export function TextInput(hdlr: (v: string) => any, sources: LabelInputSources) {
    const intent$ = textInputIntent(sources.DOM);
    const model$ = inputState(hdlr, intent$);
    const view$ = textInputView(sources.props$, model$);

    return {
        DOM: view$
    }
}

const drivers = {
    DOM: makeDOMDriver("#test")
}

function test(sources) {
    const props$ = Rx.Observable.of({
        name: "foo", 
        initial: "Sean",
    });
    const tinput$ = TextInput((val) => val, {DOM: sources.DOM, props$: props$})

    return {
        DOM: tinput$.DOM
    }
}

run(test, drivers);

export function makeTableRow(row: string, value: string) {
    return tr([
        td(".form-tr", _(row)),
        td([
            span(_)
        ])
    ])
    //return <tr key={row}><td className="form-tr-ct-title">{_(row)}</td><td><span>{value}</span></td></tr>
}