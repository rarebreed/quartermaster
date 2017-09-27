/** @flow
 * This module is primarily concerned with getting information from DBus, and supplying it to the Model layer.  As
 * such, it could be considered part of the Model layer.
 */
const cockpit = require("cockpit");
//const { Map } = require("immutable");
import Rx from "rxjs/Rx";


// The com.redhat.SubscriptionManager Interfaces and Objects
const SubManPaths = ["com", "redhat", "SubscriptionManager"];
export const SubManSvc = SubManPaths.join(".");
const SubManInterfaces = ["EntitlementStatus"];
export const SubManIfcs = SubManInterfaces.reduce((acc, n) => {
    acc[n] = `${SubManSvc}.${n}`;
    return acc;
}, {});
export const SubManObjs = SubManInterfaces.reduce((acc, n) => {
    acc[n] = "/".concat(n);
    return acc;
}, {});

// The com.redhat.RHSM1 Interfaces and Objects
const RHSMPaths = ["com", "redhat", "RHSM1"];
export const RHSMSvc = RHSMPaths.join(".");
const RHSMInterfaces = ["Config", "RegisterServer"];
export const RHSMIfcs = RHSMInterfaces.reduce((acc, n) => {
    acc[n] = `${RHSMSvc}.${n}`;
    return acc;
}, {});
export const RHSMObjs = RHSMInterfaces.reduce((acc, n) => {
    acc[n] = "/".concat(RHSMPaths.join("/").concat(`/${n}`));
    return acc;
}, {});

export const suser = {superuser: "require"};


/**
 * Helper function to get the dbus service and a proxy
 *
 * TODO: Figure out the type of opts
 *
 * @param {*} iface
 * @param {*} obj
 * @param {*} sName
 * @param {*} opts
 */
function getDbusIface(iface: string, obj: string, sName: string = RHSMSvc, opts={superuser: "require"}) {
    let svc = cockpit.dbus(sName, opts);
    let cfgPxy = svc.proxy(iface, obj);
    return {
        service: svc,
        proxy: cfgPxy
    }
}


/**
 * Uses the Configuration DBus interface to get a section:key from the rhsm.conf file
 *
 * @param {*} property
 */
export function getRhsmConf(property: string): Promise<{t: string, v: string}> {
    let { service, proxy } = getDbusIface(RHSMIfcs.Config, RHSMObjs.Config);
    let waitPrm = proxy.wait();
    return waitPrm.then(() =>
        proxy.Get(property)
          .then(p => p)
          .catch(e => console.log(e))
    )
}


/**
 * Sets a value in rhsm.conf
 *
 * TODO: make a regex to validate vtype
 *
 * @param {*} property The (section.)key to set (eg server.hostname)
 * @param {*} value What to se the value to
 * @param {*} vtype The dbus sig type of the value (eg "s" or "i")
 */
export function setRhsmConf( property: string
                           , value: any
                           , vtype: string) {
    let { service, proxy } = getDbusIface(RHSMIfcs.Config, RHSMObjs.Config);
    return proxy.wait(() => {
        let setPromise = proxy.Set(property, {t: vtype, v: value});
        setPromise.done(() => {
            let getPromise = proxy.Get(property);
            getPromise.done(r => {
                console.log(r)
                if (r.v !== value)
                    console.error(`Did not set the value of ${property} to ${value}`)
            }).fail(e => console.error(e));
        }).fail(e => console.error(e))
    });
}


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


function statusListener(evt: any, name: any, args: any) {
    console.log(`Event was: ${evt}`);
    console.log(`Name was ${name}`);
    console.log(`Args were: ${args}`);
}

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
    subject.subscribe({
        next: (v: T) => {
            console.log(v);
            return v;
        }
    })

    const listener = (evt: any, name: any, args: any) => subject.next({evt: evt, name: name, args: args});
    return {
        evtState$: subject,
        listener: listener
    }
}

/**
 * Gets the initial status
 */
function status(): Rx.Observable<string> {
    let { service, proxy } = getDbusIface(SubManIfcs.EntitlementStatus, SubManObjs.EntitlementStatus, SubManSvc);
    let { evtState$, listener } = makeEventState({evt: "", name: "", args: ""});

    let pproxy: Promise<{t: string, v: string}> = proxy.wait()
      .then(() => {
          proxy.addEventListener("signal", listener)
      })
      .then(() => proxy.call("check_status", []))
      .then((r: {t: string, v: string}) => {
          if (r == undefined)
            return "UNKNOWN";
          else
            return EntitlementStatus.get(r[0])
      })
      .catch(err => console.error(err));
    let start$ = Rx.Observable.fromPromise(pproxy);
    start$.mergeMap(s => evtState$.startWith(s.v));
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

/**
 * A stream wrapped around the dbus signal listener to be notifed when the status changes
 */
export function updateStatus() {

}
