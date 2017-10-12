/**@flow
 * 
 */

import { getService, getSvcProxy, RHSMSvc, suser, getDbusIface } from "./rhsm.dbus"
import type { ConfigProxy , Service} from "quartermaster"

 /**
 * Uses the Configuration DBus interface to get a section:key from the rhsm.conf file
 *
 * @param {*} property
 */
export function getRhsmConf(property: string): Promise<{t: string, v: string}> {
    let res = getDbusIface(RHSMSvc, "Config")
    let proxy: ConfigProxy = res.proxy
    //let service = getService(RHSMSvc, suser)
    //let proxy = getSvcProxy(service, "Config")
    let waitPrm = proxy.wait();
    return waitPrm.then(() =>
        proxy.Get(property)
            .then(p => p)
            .catch(e => {
                let res = {
                    t: "s",
                    v: "Could not get property"
                }
                return res
          })
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
                           , vtype: string)
                           : Promise<{t: string, v: any}> {
    let service = getService(RHSMSvc, suser)
    let proxy = getSvcProxy(service, "Config")
    let prmPxy = proxy.wait()
    return prmPxy.then(() => {
        return proxy.Set(property, {t: vtype, v: value})
          .then(() => {
            return proxy.Get(property)
              .then(r => {
                console.log(`In Get of Set: ${r.v}`)
                if (r.v !== value)
                    console.error(`Did not set the value of ${property} to ${value}`)
                return r;
              })
              .catch(e => console.error(e));
          })
          .catch(e => console.error(e))
    });
}