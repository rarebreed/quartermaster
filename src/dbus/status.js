//@flow
const cockpit = require("cockpit");
const immutable = require("immutable");
const Map = immutable.Map;

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
 * Sets a value in rhsm.conf
 * 
 * @param {*} property 
 * @param {*} value 
 * @param {*} vtype 
 */
export function setRhsmConf(property: string, value: any, vtype: string) {
    let svc = cockpit.dbus(RHSMSvc, {superuser: "require"});
    let cfgPxy = svc.proxy(RHSMIfcs.Config, RHSMObjs.Config);
    cfgPxy.wait(() => {
        let setPromise = cfgPxy.Set(property, {t: vtype, v: value});
        setPromise.done(() => {
            let getPromise = cfgPxy.Get(property);
            getPromise.done(r => {
                console.log(r)
                if (r.v !== value)
                    console.error(`Did not set the value of ${property} to ${value}`)
            }).fail(e => console.error(e));
        }).fail(e => console.error(e))
    });
}


// These are the possible return values from check_status (taken from cert_sorter.py)
type StatusMap = [number, string];
let _EntitlementStatus: Map<number, string> = new Map();
const _statuses: Array<StatusMap> = [
    [-1, "UNKNOWN"],
    [0, "RHSM_VALID"],
    [1, "RHSM_EXPIRED"],
    [2, "RHSM_WARNING"],
    [3, "RHN_CLASSIC"],
    [4, "RHSM_PARTIALLY_VALID"],
    [5, "RHSM_REGISTRATION_REQUIRED"]
]
export const EntitlementStatus = _statuses.reduce((acc, n) => {
    if (acc)
        return acc.set(n[0], n[1]);
    else
        console.error(`Somehow acc was null or undefined.  Skipping ${n}`)
}, _EntitlementStatus)


function statusListener(evt: any, name: any, args: any) {
    console.log(evt);
    console.log(name);
    console.log(args);
}


/**
 * 
 */
export function getStatus(): Promise<string> {
    let svc = cockpit.dbus(SubManSvc, suser);
    let proxy = svc.proxy(SubManIfcs.EntitlementStatus, SubManObjs.EntitlementStatus);
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
}
