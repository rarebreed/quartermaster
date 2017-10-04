/**@flow
 * This module provides functionality to register to candlepin using the rhsm RegisterServer and Register interfaces
 */
const cockpit = require("cockpit");
import Rx from "rxjs/Rx";
import {getDbusIface, RHSMIfcs, RHSMObjs, suser} from "./rhsm.dbus.js";

export type RegisterArgs = {
    user: string,
    password: string,
    org: string | number,
    keys?: Array<string> 
}

export type RegisterOptions = {
    force?: boolean,
    name?: string,
    consumerid?: string,
    environment?: string
}

// These will override what's in rhsm.conf
export type RegisterConnectionOptions = {
    host?: string,        // the subscription management server host
    port?: number,        // the subscription management server port
    handler?: string,     // the context of the subscription management server. E.g. /subscriptions
    insecure?: boolean,   // disable TLS/SSL host verification
    proxy_hostname?: string,
    proxy_user?: string,
    proxy_password?: string
}


// These are all the options that could be passed.  Note that all these options must be available to be
// entered from the cockpit plugin
export type RegisterAllOptions = RegisterArgs & RegisterOptions & RegisterConnectionOptions

const registerPath = (path: string) => {
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
    let { service, proxy } = getDbusIface(RHSMIfcs.RegisterServer, RHSMObjs.RegisterServer);
    let pxyPrm: Promise<string> = proxy.wait()
        .then(() => {
            return proxy.Start()
        })
        .then(result => {
            console.log(result)
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

    return regArgs$.mergeMap(regArgs => {
        return start$.mergeMap(bus => {
            console.log(`The socket address is ${bus}`);
            let opts = {superuser: "require", bus: "none", address: bus}
            let { service, proxy } = getDbusIface(RHSMIfcs.Register, RHSMObjs.Register, null, opts);
            // org, username, pw, RegisterOptions dict, RegisterConnectionOptions dict
            let typeSig = "sssa{sv}a{sv}";
            let regOpts = makeOpt(regArgs, ["force", "name", "consumerid", "environment"]);
        
            let regConNames = ["host", "port", "handler", "insecure", "proxy_hostname", "proxy_user", "proxy_password"];
            let regConnOpts = makeOpt(regArgs, regConNames);
            
            // These are the args we actually pass
            let args = [regArgs.org, regArgs.user, regArgs.password, regOpts, regConnOpts];
            let prmPxy = proxy.wait()
                .then(() => proxy.call("Register", args, {type: typeSig}))
                .then(res => { 
                    console.log(res);
                    return res;
                })
                .catch(err => {
                    console.error("Failure running Register() method")
                    console.error(err)
                    return ""
                });

            return Rx.Observable.fromPromise(prmPxy);
        })
    })
}