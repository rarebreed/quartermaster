/**@flow
 * This module provides functionality to register to candlepin using the rhsm RegisterServer and Register interfaces
 */
const cockpit = require("cockpit");
import Rx from "rxjs/Rx";
import { getSvcProxy, getService, RHSMIfcs, RHSMObjs, RHSMSvc, suser} from "./rhsm.dbus.js";
import type { RegisterArgs
            , RegisterOptions
            , RegisterConnectionOptions
            , UnregisterProxy 
            , RegisterProxy
            , RegisterServerProxy } from "quartermaster"


// These are all the options that could be passed.  Note that all these options must be available to be
// entered from the cockpit plugin
export type RegisterAllOptions = RegisterArgs & RegisterOptions & RegisterConnectionOptions

export const registerPath = (path: string) => {
    let [socket, ...rest] = path.split(",");
    if (socket === path) {
        console.error("Could not get unix socket path");
        return "";
    }
    return socket;
}

/**
 * This is the first part of the register process as it will create the unix socket to talk to the Register interface
 */
export
function startRegister() {
    //let { service, proxy } = getDbusIface(RHSMIfcs.RegisterServer, RHSMObjs.RegisterServer);
    let service = getService(RHSMSvc, suser)
    let proxy: RegisterServerProxy = getSvcProxy(service, "RegisterServer")
    let pxyPrm = proxy.wait()
        .then(() => {
            return proxy.Start()
            //return proxy.call("Start", null)
        })
        .then(result => {
            return result
        })
        .catch(console.error);
    return Rx.Observable.fromPromise(pxyPrm).map(s => registerPath(s));
}


/**
 * Performs a register command and wraps it in an Observable 
 * 
 * Takes a start stream which holds the socket address for the actual registration to take place and an args stream 
 * which holds values to do the registration with, such as the username, org and password
 * 
 * @param {*} start$ 
 * @param {*} regArgs$ 
 */
export
function register( start$: Rx.Observable<string>
                 , regArgs$: Rx.Observable<RegisterAllOptions>)
                 : Rx.Observable<string> {
    const makeOpt = (all: {}, keyNames: Array<string>) => {
        return keyNames.filter(n => all[n] != null)
            .reduce((acc, n) => {
                acc[n] = all[n];
                return acc;
            }, {});
    }

    return start$.do(b => console.log(`The socket address ${b}`)).mergeMap(bus => {
        return regArgs$.mergeMap(regArgs => {
            let opts = {superuser: "require", bus: "none", address: bus}
            let service = getService(null, opts)
            service.wait(() => {
                console.log("Service is ready")
            })
            let proxy: RegisterProxy = getSvcProxy(service, "Register")
            //let { service, proxy } = getDbusIface(RHSMIfcs.Register, RHSMObjs.Register, null, opts);
            // org, username, pw, RegisterOptions dict, RegisterConnectionOptions dict
            let typeSig = "sssa{sv}a{sv}";
            let regOpts = makeOpt(regArgs, ["force", "name", "consumerid", "environment"]);
        
            let regConNames = ["host", "port", "handler", "insecure", "proxy_hostname", "proxy_user", "proxy_password"];
            let regConnOpts = makeOpt(regArgs, regConNames);
            
            // These are the args we actually pass
            let args = [regArgs.org, regArgs.user, regArgs.password, regOpts, regConnOpts];
            console.log(`Calling Register with these args: ${JSON.stringify(args)}`)
            let prmPxy: Promise<string> = proxy.wait()
                .then(() => proxy.call("Register", args, {type: typeSig}))
                //.then(() => proxy.Register(...args))
                .then(res => { 
                    console.log(`Result of Register: ${JSON.stringify(res)}`);
                    return res;
                })
                .catch(err => {
                    console.error("Failure running Register() method")
                    console.error(err)
                    return "Failed to register"
                });

            return Rx.Observable.fromPromise(prmPxy)
        })
    })
}


/**
 * 
 * @param {*} start$ 
 * @param {*} unregArgs$ 
 */
export 
function unregister( unregArgs$: Rx.Observable<RegisterConnectionOptions> )
                   : Rx.Observable<string> {
    return unregArgs$.mergeMap(u => {
        //let opts = {superuser: "require", bus: "none", address: sock}
        //let { service, proxy } = getDbusIface(RHSMIfcs.Unregister, RHSMObjs.Unregister, RHSMSvc, suser);
        let service = getService(RHSMSvc, suser)
        let proxy: UnregisterProxy = getSvcProxy(service, "Unregister")
        console.log(`Unregargs is: ${JSON.stringify(u)}`)
        let pp: Promise<string> = proxy.wait()
            .then(() => proxy.call("Unregister", [u], {type: "a{sv}"}))
            //.then(() => proxy.Unregister(u))
            .then(p => {
                console.debug("Unregister method called successfully")
                return "Successful unregistration"
            })
            .catch(err => {
                console.error("Unable to Unregister")
                console.error(err)
                return "Failed to unregister"
            });
        return Rx.Observable.fromPromise(pp)
    })
}