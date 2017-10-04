/**@flow
 * These are helper functions 
 */

 import type { SpawnResult } from "../../src/lib/spawn"
 import { launch } from "../../src/lib/spawn"
 import Rx from "rxjs/Rx"

 /**
 * Gets the <input> element, sets the value and triggers a synthetic event so that cyclejs streams "hear" it
 * 
 * @param {*} e$ 
 * @param {*} val 
 */
export const setInput = (e$: Rx.Observable<HTMLInputElement>, val: string) => {
    return e$.map((e: HTMLInputElement) => {
            e.value = val
            let inpEvt = new Event("input", { bubbles: true, cancelable: true})
            e.dispatchEvent(inpEvt)
            return e
        })
        .do(e => console.log(`Sending event with ${e.value}`))
        .subscribe({
            next: elm => console.debug("Set the input"),
            error: err => console.log(err)
        })
}

/**
 * 
 * @param {*} cmd 
 */
export
const runCmd = (cmd: string[]) => (done: Function) => {
    console.log(`Running ${cmd.join(" ")}`)
    let { result$, output$ } = launch(cmd)
    output$.subscribe(console.log)
    result$.subscribe({
        next: (res: SpawnResult) => {
            console.log(res)
            done()
        },
        error: (err: SpawnResult) => console.error(err),
        complete: () => console.log("Process completed")
    })
}