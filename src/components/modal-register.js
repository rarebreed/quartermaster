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
import isolate from "@cycle/isolate";
import { TextInput } from "./generic-view";
import type { Component, LabelInputProps, LabelInputSources } from "quartermaster";
import { id } from "../lib/lambda";
import Rx from "rxjs/Rx";
import type { RegisterArgs } from "../lib/registration"
const Stream = Rx.Observable;


// Starting values for the labels in the TextInputs
const loginProps$ = Stream.of({name: "Login", initial: ""});
const pwProps$ = Stream.of({name: "Password", initial: ""});
const akProps$ = Stream.of({name: "Activation Key", initial: "key_one,key_two"});
const orgProps$ = Stream.of({name: "Organization", initial: ""});

const LoginInput = isolate(TextInput, "login")
const PWInput = isolate(TextInput, "pw")
const AKInput = isolate(TextInput, "activation_keys")
const OrgInput = isolate(TextInput, "org")

type ModalComponent = {
    DOM: DOMSource,
    values: {
        login: Rx.Observable<string>,
        pw: Rx.Observable<string>,
        keys: Rx.Observable<string>,
        org: Rx.Observable<string>
    }
}

type RegisterIntent = { 
    input$: Rx.Observable<RegisterArgs>,
    button$: Rx.Observable<MouseEvent>
}

/**
 * Data stream that merges all the text inputs and scans them into a single result.
 *  
 * @param {*} domSrc
 */
function registerIntent(sources: ModalComponent): RegisterIntent  {
    let s1$ = sources.values.login.map(v => {login: v})
    let s2$ = sources.values.pw.map(v => {password: v})
    let s3$ = sources.values.keys.map(v => {keys: v.split(",")})
    let s4$ = sources.values.org.map(v => {org: v})
    let btn$ = sources.DOM.select("#registration-btn")
        .events("click")
        .filter((evt: MouseEvent) => evt.button !== 2)

    return {
        input$: s1$.merge(s2$, s3$, s4$),
        button$: btn$
    }
}

/**
 *
 * @param {*} intent$
 */
function registerModel(intent: RegisterIntent) {
    // This merges all the input streams together, mapping each respective stream's value to a object, and these 
    // objects are then reduced by effectively merging all the dictionaries together.  Since scan gives a stream of all
    // the intermediate results, we take them until we get the registration button click event
    let {input$, button$} = intent
    let value$ = input$
        .scan((acc, n) => {
            for (var [k, v] of n) {
                acc.set(k, v)
            }
            return acc
        }, new Map())
        .do(console.log)
        .takeUntil(button$)

    // TODO: Perform a register or unregister
    return value$
}

/**
 * All this function does is return the actual View component (so it can be rendered to the VDOM).  
 * 
 * @param {*} domSrc 
 * @param {*} state$ 
 */
function registerView( domSrc: DOMSource
                     , state$: Stream<string>
                     , status$: Stream<string>)
                     : ModalComponent {
    function makeTISrc(prop: Stream<LabelInputProps>): LabelInputSources {
        return { DOM: domSrc, props$: prop }
    }

    const textInputs: Array<Component<string>> = [
        LoginInput(id, makeTISrc(loginProps$)),
        PWInput(id, makeTISrc(pwProps$)),
        AKInput(id, makeTISrc(akProps$)),
        OrgInput(id, makeTISrc(orgProps$))
    ];

    let view$ = status$.map(s => {
        let btnLbl = "Register"      
        if (s === "RHSM_VALID")
            btnLbl = "Unregister"
        return div(".modal-register", [
            ...textInputs,
            button("#registration-btn", btnLbl)
        ])
    })

    return {
        DOM: view$,
        state: state$,
        values: {
            login: LoginInput.value,
            pw: PWInput.value,
            keys: AKInput.value,
            org: OrgInput.value
        }
    }
}


export function ModalRegister(sources: ModalComponent, status$: Rx.Observable<string>) {
    let actions = registerIntent(sources)
    let state$ = registerModel(actions)
    let view = registerView(sources.DOM, state$)

    return view;
}
