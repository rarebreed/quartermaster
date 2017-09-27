//@flow
//import { DOMSource } from  "@cycle/dom";
import Rx from "rxjs/Rx";

declare module "quartermaster" {
    declare type LabelInputProps = {
        name: string,
        initial: string
    }

    declare type SliderInputProps = {
        label: LabelInputProps,
        min: number,
        max: number,
        unit: string
    }

    declare type LabelInputSources = {
        DOM: any,  // This is a DOMSource, but need to convert this to a flow type
        props$: Rx.Observable<LabelInputProps>
    }

    declare type Component<T> =  {
        DOM: Rx.Observable<any>,   // need to figure out the type of this
        value: Rx.Observable<T>
    }
}
