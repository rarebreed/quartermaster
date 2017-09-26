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
import type { LabelInputProps, LabelInputSources, Component } from "quartermaster"; 
//import xs, { Stream, MemoryStream } from "xstream";
//import { run } from "@cycle/run";
import Rx from "rxjs/Rx";
//const cockpit = require("cockpit");
//const _: (s: string) => string = cockpit.gettext;

function textInputIntent(domSrc: DOMSource ): Rx.Observable<string> {
    return domSrc.select(".input")
      .events("input")
      .map(evt => evt.target.value);
}


function inputState<T>( fn: (v: T) => any
                      , inpEvts: Rx.Observable<T>
                      , start: T)
                      : Rx.Observable<T> {
    return inpEvts.map(fn)
      .startWith(start);
}

/**
 * Creates the actual DOM component for the labeled input
 * 
 * FIXME:  Everytime someone enters text in the field, the div will be redrawn which seems like a performance waste.
 * 
 * @param {*} props$ 
 * @param {*} state$ 
 */
function textInputView( props$: Rx.Observable<LabelInputProps>
                      , state$: Rx.Observable<string>)
                      : Rx.Observable<string> {
    return props$.mergeMap(p => {
        return state$.map(s => 
            div(".labeled-input",[
                label(".label", p.name),
                input(".input", {attrs: {type: "text", defaultValue: p.initial}})
            ])
        )
    })
}

/**
 * A generic widget component with a Label, and an input text field.
 * 
 * The user will supply a function that takes a string and returns some other value.  This hdlr function is how other 
 * business logic can be handled when the user types something into the input field.
 * 
 * @param {*} hdlr 
 * @param {*} sources 
 */
export function TextInput( hdlr: (v: string) => any
                         , sources: LabelInputSources)
                         : Component<string> {
    const intent$ = textInputIntent(sources.DOM);
    const model$ = inputState(hdlr, intent$, "");
    const view$ = textInputView(sources.props$, model$);

    return {
        DOM: view$,
        value: model$.map(v => v)
    }
}


export function makeTableRow(row: string, value: string) {
    return tr([
        td(".form-tr", _(row)),
        td([
            span(_)
        ])
    ])
    /**
     * JSX version
     * return (
     *   <tr key={row}>
     *     <td className="form-tr-ct-title">{_(row)}</td>
     *     <td><span>{value}</span></td>
     *   </tr>
     * );
     */
}