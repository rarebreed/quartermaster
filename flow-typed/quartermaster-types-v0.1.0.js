//@flow
import { DOMSource } from  "@cycle/dom";
import Rx from "rxjs/Rx";

declare module "quartermaster" {
    declare export type LabelInputProps = {
        name: string, 
        initial: string
    }

    declare export type SliderInputProps = {
        label: LabelInputProps,
        min: number,
        max: number,
        unit: string
    }

    declare export type LabelInputSources = {
        DOM: DOMSource,
        props$: Rx.Observable<LabelInputProps>
    }

    declare export type Component<T> =  {
        DOM: Rx.Observable<any>,   // need to figure out the type of this
        value: Rx.Observable<T>
    }
}

