/**@flow
 * This module contains the functionality needed for access to the rhsm dbus services
 */
const cockpit = require("cockpit");

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

// TODO: Add Facts Interface and Objects

type DBusOpts = {
    bus?: ?string,
    host?: string,
    superuser?: "require",
    track?: "try"
}
export const suser: DBusOpts = { superuser: "require" };


/**
 * Helper function to get the dbus service and a proxy
 *
 * If the sName argument is null, then it means that the cockpit dbus interface will talk to a peer.  The DBusOpts 
 * has a setting for bus options, however, in this case, you should pass null to sName.  This is useful for the Register
 * method, since the work is actually being done over a unix socket, rather than a user, system or session bus.
 *
 * @param {*} iface name of the interface (eg com.redhat.RHSM1.Config)
 * @param {*} obj name of the object path (eg /com/redhat/RHSM1/Config)
 * @param {string} sName the name of the service (eg com.redhat.RHSM1)
 * @param {DBusOpts} opts
 */
export function getDbusIface( iface: string
                            , obj: string
                            , sName: ?Services = RHSMSvc
                            , opts: DBusOpts = {superuser: "require"}) {
    let svc = cockpit.dbus(sName, opts);
    let cfgPxy = svc.proxy(iface, obj);
    return {
        service: svc,
        proxy: cfgPxy
    }
}
