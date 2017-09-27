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
import { isolate } from "@cycle/isolate";
import { TextInput } from "./generic-view";
import qm from "quartermaster";
import type { Component, LabelInputProps, LabelInputSources } from "quartermaster";
import { id } from "../lib/lambda";
import Rx from "rxjs/Rx";
const Stream = Rx.Observable;


// Starting values for the labels in the TextInputs
const loginProps$ = Stream.of({name: "Login", initial: ""});
const pwProps$ = Stream.of({name: "Password", initial: ""});
const akProps$ = Stream.of({name: "Activation Key", initial: "key_one,key_two"});
const orgProps$ = Stream.of({name: "Organization", initial: ""});

const LoginInput = isolate(TextInput, "login")
const PWInput = isolate(TextInput, "pw")
const AKInput = isolate(TextInput, "activation_key")
const OrgInput = isolate(TextInput, "org")

/**
 * Data stream of
 * @param {*} domSrc
 */
function registerIntentInp(domSrc: DOMSource) {
    domSrc.select("")
}

function registerIntentBtn(domSrc: DOMSource) {

}

/**
 *
 * @param {*} intent$
 */
function registerModel<T>(intent$: Stream<T>): Stream<T> {

}

function registerView( domSrc: DOMSource
                     , state$: Stream<string>)
                     : Component<string> {
    function makeTISrc(prop: Stream<LabelInputProps>): LabelInputSources {
        return { DOM: domSrc, props$: prop }
    }

    const textInputs: Array<Component<string>> = [
        LoginInput(id, makeTISrc(loginProps$)),
        PWInput(id, makeTISrc(pwProps$)),
        AKInput(id, makeTISrc(akProps$)),
        OrgInput(id, makeTISrc(orgProps$))
    ];

    let view$ = state$.map(s => div(".modal-register", [
            ...textInputs,
            button("#registration-btn", s)
        ])
    )

    return {
        DOM: view$,
        value: Stream.of("")
    }
}
