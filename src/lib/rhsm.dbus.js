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
 * @param {*} iface name of the interface (eg com.redhat.RHSM1.Config)
 * @param {*} obj name of the object path (eg /com/redhat/RHSM1/Config)
 * @param {string} sName the name of the service (eg com.redhat.RHSM1)
 * @param {DBusOpts} opts
 */
export function getDbusIface( iface: string
                            , obj: string
                            , sName: ?Services = RHSMSvc
                            , opts: DBusOpts = {superuser: "require"})
                            : { service: Service, proxy: Proxy } {
    let svc: Service = cockpit.dbus(sName, opts);
    console.debug(`Calling svc.proxy(${JSON.stringify(iface)}, ${JSON.stringify(obj)})`)
    let cfgPxy: Proxy = svc.proxy(iface, obj);
    return {
        service: svc,
        proxy: cfgPxy
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

export function getSvcProxy(svc: Service, ifc: string) {
    return svc.proxy(RHSMIfcs[ifc], RHSMObjs[ifc])
}

/**
 * Technically, this class doesn't need to be a singleton, but it probably should be
 */
class _RHSMDbus {
    registerServerProxy: Proxy;
    registerProxy: Proxy;
    unregisterProxy: Proxy;
    attachProxy: Proxy;
    configProxy: Proxy;
    entitlementsProxy: Proxy;
    productsProxy: Proxy;
    socket: string;
    proxies: Map<RHSMIFTypes, Proxy>;
    service: Service;
    registerService: Service

    constructor() {
        this.socket = ""
        this.service = getService(RHSMSvc, suser)

        let regular = RHSMInterfaces
            .filter(i => i !== "Register")
            .map(i => i)
        
        this.registerServerProxy = this.service.proxy(RHSMIfcs.RegisterServer, RHSMObjs.RegisterServer)
        this.unregisterProxy = this.service.proxy("com.redhat.RHSM1.Unregister", "/com/redhat/RHSM1/Unregister")
        this.attachProxy = this.service.proxy(RHSMIfcs.Attach, RHSMObjs.Attach)
        this.configProxy = this.service.proxy(RHSMIfcs.Config, RHSMObjs.Config)
        this.entitlementsProxy = this.service.proxy(RHSMIfcs.Entitlement, RHSMObjs.Entitlement)
        this.productsProxy = this.service.proxy(RHSMIfcs.Products, RHSMObjs.Products)       

        let regStart$ = this.startRegister()
        regStart$
            .do(bus => {
                console.log(`The bus socket is ${bus}`)
            })
            .map(bus => bus)
            .subscribe({
                next: bus => {
                    this.socket = bus
                    this.registerService = getService(null, {superuser: "require", bus: "none", address: bus})
                    this.registerProxy = this.registerService.proxy(RHSMIfcs.Register, RHSMObjs.Register)
                },
                error: err => {
                    console.error(`Failed to Register`)
                    console.error(err)
                }
            })
    }

    _registerServerDbus() {
        let { service, proxy } = getDbusIface(RHSMIfcs.RegisterServer, RHSMObjs.RegisterServer);
    }

    startRegister() {
        let proxy = this.registerServerProxy
        let pxyPrm: Promise<string> = proxy.wait()
            .then(() => console.log("RegisterServer proxy is ready"))
            .then(() => proxy.call("Start", []))
            .then(result => {
                console.log(result)
                return result[0]
            })
            .catch(err => {
                console.error(`Could not start RegisterServer ${JSON.stringify(err)}`)
                return ""
            });
        return Rx.Observable.fromPromise(pxyPrm).map(s => registerPath(s));
    }

    _proxyPromises() {
        const finished = (svc: string) => () => {
            console.log(`Proxy ${svc} is ready`)
        } 
        this.registerServerProxy.wait(finished("RegisterServer"))
        this.unregisterProxy.wait(finished("Unregister"))
        this.attachProxy.wait(finished("Attach"))
        this.entitlementsProxy.wait(finished("Entitlement"))
        this.productsProxy.wait(finished("Product"))
        this.configProxy.wait(finished("Config"))
    }
}

const _rhsmDbus = () => {
    let rhsm;
    return (): _RHSMDbus => {
        if (rhsm == null)
            rhsm = new _RHSMDbus()
        return rhsm
    }
}
export const RHSMDBus = _rhsmDbus()