/**@flow
 * Helper functions for spawning commands on the cockpit server
 */
const cockpit = require("cockpit");
import Rx from "rxjs/Rx";

export type SpawnOpts = {
    binary?: boolean,
    directory?: string,
    err?: "out" | "ignore" | "message" | null,
    host?: string,
    environ?: string[],
    pty?: boolean,
    batch?: number,
    latency?: number,
    superuser?: "require" | "try"
}

export type SpawnResult = {
    message?: string,
    problem?: ?string,
    exit_status?: ?number,
    exit_signal?: ?string
}

const defaultOpts: SpawnOpts = {
    err: "out",
    superuser: "try"
}

/**
 * Launches a command on the cockpit server
 * 
 * @param {string[]} args 
 * @param {SpawnOpts} options 
 */
export function launch( args: string[]
                      , options?: SpawnOpts=defaultOpts)
                      : { result$: Rx.Observable<SpawnResult>,
                          output$: Rx.BehaviorSubject<string> } {
    const process = cockpit.spawn(args, options);  
    let stdout$: Rx.BehaviorSubject<string> = new Rx.BehaviorSubject("");
    
    // The stdout handler
    const outHandler = (data: string) => stdout$.next(data);
    let procResult$: Promise<SpawnResult> = process.stream(outHandler)
      .then((data, msg) => {
        return {
            message: `Process ${args[0]} completed normally`,
            problem: null,
            exit_status: 0,
            exit_signal: null
        }
      })
      .fail((err: SpawnResult) => {
          let exitStat = "null";
          if (err.exit_status != null)
              exitStat = err.exit_status
          let problem = "";
          if (err.problem != null)
              problem = err.problem;
          let msg = "";
          if (err.message != null)
              msg = err.message
        console.error(`Exit code: ${exitStat}\nProblem: ${problem}\n${msg}`);
        return err;
      });

    return {
        output$: stdout$,
        result$: Rx.Observable.fromPromise(procResult$)
    }
}