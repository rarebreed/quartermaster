/**@flow
 * This module contains the functionality needed for access to the rhsm dbus services
 */
const cockpit = require("cockpit");
import type { Proxy, Service, UnregisterProxy, RegisterProxy, RegisterServerProxy } from "quartermaster"
import { registerPath } from "./registration"
import Rx from "rxjs/Rx"
import { last } from "ramda"

// ====================================================================
// The com.redhat.SubscriptionManager Interfaces and Objects
// ====================================================================
// FIXME: This interface will be deprecated
export const SubManSvc = "com.redhat.SubscriptionManager";
export const SubManIfcs = {
    EntitlementStatus: "com.redhat.SubscriptionManager.EntitlementStatus"
}
export const SubManObjs = {
    EntitlementStatus: "/EntitlementStatus"
}


// The com.redhat.RHSM1 Interfaces and Objects
// TODO: Add methods for each IFType (eg RegisterServer.Start)
export type Services = "com.redhat.RHSM1" | "com.redhat.SubscriptionManager";
const RHSMPaths = ["com", "redhat", "RHSM1"];
export const RHSMSvc = "com.redhat.RHSM1"; // RHSMPaths.join("."); if this is used, type checker will complain
export type RHSMIFTypes = "Attach"
                        | "Config"
                        | "Entitlement"
                        | "Products"
                        | "Register"
                        | "RegisterServer"
                        | "Unregister";
export const RHSMInterfaces: Array<RHSMIFTypes> = 
    [ "Attach"
    , "Config"
    , "Entitlement"
    , "Products"
    , "Register"
    , "RegisterServer"
    , "Unregister"
    ];
export const RHSMIfcs = RHSMInterfaces.reduce((acc, n) => {
    acc[n] = `${RHSMSvc}.${n}`;
    return acc;
}, {});
export const RHSMObjs = RHSMInterfaces.reduce((acc, n) => {
    acc[n] = "/".concat(RHSMPaths.join("/").concat(`/${n}`));
    return acc;
}, {});

export type DBusOpts = {
    bus?: ?string,
    host?: string,
    superuser?: "require",
    track?: "try"
}

// TODO: Add Facts Interface and Objects
export const suser: DBusOpts = { superuser: "require" };


/**
 * Helper function to get the dbus service and a proxy
 *
 * If the sName argument is null, then it means that the cockpit dbus interface will talk to a peer.  The DBusOpts 
 * has a setting for bus options, however, in this case, you should pass null to sName.  This is useful for the Register
 * method, since the work is actually being done over a unix socket, rather than a user, system or session bus.
 * 
 * @param {*} sName 
 * @param {*} ifc 
 * @param {*} opts 
 */
export function getDbusIface(sName: ?Services, ifc: RHSMIFTypes, opts: DBusOpts = suser) {
    let service = getService(RHSMSvc, suser)
    let proxy = getSvcProxy(service, "Config")
    return {
        service: service,
        proxy: proxy
    }
}

export function getService( svcName: ?Services = RHSMSvc
                          , opts: DBusOpts = {superuser: "require"})
                          : Service {
    console.debug(`Calling cockpit.dbus(${JSON.stringify(svcName)}, ${JSON.stringify(opts)})`)
    let svc: Service = cockpit.dbus(svcName, opts);
    return svc
}

export function getProxy( svc: Service
                        , iface: string
                        , obj: string)
                        : Proxy {
    console.debug(`Calling svc.proxy(${JSON.stringify(iface)}, ${JSON.stringify(obj)})`)
    let cfgPxy = svc.proxy(iface, obj);
    return cfgPxy
}

export function getSvcProxy(svc: Service, ifc: string, obj?: string) {
    if (obj == null)
        return svc.proxy(RHSMIfcs[ifc], RHSMObjs[ifc])
    else
        return svc.proxy(ifc, obj)
}
