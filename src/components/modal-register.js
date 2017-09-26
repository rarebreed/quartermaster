/**@flow
 * The modal registration dialog
 * 
 * Intent:
 *   Data is collected in all the input components.  When the Registration button is clicked, it will make a dbus call
 *   for the registration
 * 
 * Model:
 *   This widget needs to know the following:
 *   - current entitlement status so that the label on the Button is correct
 *   - visibility of the modal div
 *   - the values of all the inputs elements
 * 
 * View:
 *   When the Registration says "Register", clicking on it will make the dbus call, and the entitlement status stream
 *   will change.  When the new event comes in, the Button label will change, the whole div will be set to invisible, 
 *   and all the input fields will be cleared.
 */
import { div, input, label, button, tr, td, span, makeDOMDriver, DOMSource } from "@cycle/dom";
import { VNode } from "@cycle/dom";
import { run } from "@cycle/rxjs-run";
import { TextInput } from "./generic-view";
import type { LabelInputProps, LabelInputSources, Component } from "quartermaster"; 
import { id } from "../lib/lambda";

// Starting values for the labels in the TextInputs
const loginProps$ = Rx.Observable.of({name: "Login", initial: ""});
const pwProps$ = Rx.Observable.of({name: "Password", initial: ""});
const akProps$ = Rx.Observable.of({name: "Activation Key", initial: "key_one,key_two"});
const orgProps$ = Rx.Observable.of({name: "Organization", initial: ""});

/**
 * Data stream of 
 * @param {*} domSrc 
 */
function registerIntentInp(domSrc: DOMSource) {
    domSrc.select("")
}

function registerIntentBtn(domSrc: DOMSource) {

}

function registerModel() {

}

function registerView(sources) {
    function makeTISrc(prop: Rx.Observable<LabelInputProps>): LabelInputSources {
        return { DOM: sources.DOM, props$: prop }
    }

    const textInputs: Array<Component<string>> = [
        TextInput(id, makeTISrc(loginProps$)),
        TextInput(id, makeTISrc(pwProps$)),
        TextInput(id, makeTISrc(akProps$)),
        TextInput(id, makeTISrc(orgProps$))
    ];

    let view = div(".modal-register", [
        ...textInputs,
        button("#registration-btn")
    ])
}