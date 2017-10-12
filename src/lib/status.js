/** @flow
 * This module is primarily concerned with getting information from DBus, and supplying it to the Model layer.  As
 * such, it could be considered part of the Model layer.
 */
const cockpit = require("cockpit");
import Rx from "rxjs/Rx";
import { getService
       , getSvcProxy
       , RHSMIfcs
       , RHSMObjs
       , SubManIfcs
       , SubManObjs
       , SubManSvc
       , suser
       } from "./rhsm.dbus.js";

// These are the possible return values from check_status (taken from cert_sorter.py)
type StatusTypes = "UNKNOWN" 
                 | "RHSM_VALID" 
                 | "RHSM_EXPIRED"
                 | "RHSM_WARNING" 
                 | "RHN_CLASSIC" 
                 | "RHSM_PARTIALLY_VALID" 
                 | "RHSM_REGISTRATION_REQUIRED";
type StatusMap = [number, StatusTypes];
const _statuses: Array<StatusMap> = [ [-1, "UNKNOWN"]
                                    , [0, "RHSM_VALID"]
                                    , [1, "RHSM_EXPIRED"]
                                    , [2, "RHSM_WARNING"]
                                    , [3, "RHN_CLASSIC"]
                                    , [4, "RHSM_PARTIALLY_VALID"]
                                    , [5, "RHSM_REGISTRATION_REQUIRED"]
                                    ]
const EntitlementStatus: Map<number, StatusTypes> = new Map(_statuses);


type EntStatusSignal = {
    evt: any, 
    name: any,
    args: any
}

/**
 * Creates an object that contains a handler function that can be passed to addEventListener for signals and a Subject
 * 
 * This function will create a handler that can be passed to a proxy.addEventListener method.  It uses a Subject so 
 * that the listener function will pass the args to the subject.next method.  This allows us to create an Observable
 * stream so that whenever the proxy's event is fired, it will be passed to the listener, and the listener will pass it 
 * to the Subject
 */
function makeEventState<T>(start: T) {
    let subject = new Rx.BehaviorSubject(start);
    subject.publish().connect()
    subject.subscribe({
        next: (v: T) => {
            console.debug("In subscribe of makeEventState")
            console.debug(v);
            return v;
        }
    })

    const listener = (evt: any, name: any, args: any) => {
        console.log(`listener was called: ${evt} ${name} ${args}`)
        if (name === "entitlement_status_changed")
            subject.next({evt: evt, name: name, args: args});
    }

    return {
        evtState$: subject,
        listener: listener
    }
}

/**
 * Returns a stream of the current status according to the EntitlementStatus DBus interface
 * 
 * This function will get the current status by making a call to EntitlementStatus.check_status().  This becomes the
 * first value of the returned stream.  The returned stream is actually a Subject which listens for any of the 
 * entitlement_status_change signals 
 */
export
function status(): Rx.Observable<string> {
    let service = getService(SubManSvc, suser)
    let proxy = getSvcProxy(service, SubManIfcs.EntitlementStatus, SubManObjs.EntitlementStatus)
    let { evtState$, listener } = makeEventState({evt: "", name: "", args: [-1]});

    // First, add an event listener with the handler we created from makeEventState, then make the call to check_status
    let prmProxy = proxy.wait()
        .then(() => {
            console.debug("Adding entitlement_status_change listener")
            proxy.addEventListener("signal", listener)
        })
        .then(() => proxy.call("check_status", []))
        .then((r) => {
            console.debug(`After call to check_status: ${r[0]}`)
            if (r == undefined)
                return "UNKNOWN";
            else
                return EntitlementStatus.get(r[0])
        })
        .catch(err => {
            console.error("Could not get check_status")
            console.error(err)
        });
    
    // Wrap the promise in a stream, so that we can use it with other streams
    let statusState$ = Rx.Observable.fromPromise(prmProxy);
    // This stream will emit an event whenever the entitlement_status_change signal is received, and thus any Observer
    // watching this stream will be updated with the latest status.  Since we use concatMap, the first event will be the call
    // to check_status.  There will only be one event from statusState.
    return statusState$.concatMap(s => evtState$
            .map(evt => evt)
            .do(r => console.log(`In status(): ${JSON.stringify(r)}`)));
}

function statusListener(evt, name, args) {
    console.log("====================")
    console.log(evt)
    console.log(name)
    console.log(args)
    console.log("====================")
}


/**
 * Uses the EntitlementStatus DBus interface method check_status to get current status
 */
export function getStatus(): Promise<string> {
    //let svc = cockpit.dbus(SubManSvc, suser);
    //let proxy = svc.proxy(SubManIfcs.EntitlementStatus, SubManObjs.EntitlementStatus);
    let { service, proxy } = getDbusIface(SubManIfcs.EntitlementStatus, SubManObjs.EntitlementStatus, SubManSvc);
    let pproxy = proxy.wait();
    return pproxy
      .then(() => {
          proxy.addEventListener("signal", statusListener);
      })
      .then(() => {
          let statProm = proxy.call("check_status", []);
          return statProm;
      })
      .then(r => {
          let mapped = EntitlementStatus.get(r[0]);
          return mapped;
      })
      .catch(err => console.log(err))
}
