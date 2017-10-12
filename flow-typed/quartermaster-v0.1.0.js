//@flow
//import { DOMSource } from  "@cycle/dom";
import Rx from "rxjs/Rx";

declare module "quartermaster" {
    declare export type RegisterArgs = {
        user: string,
        password: string,
        org: string | number,
        keys?: Array<string> 
    }

    declare export type RegisterOptions = {
        force?: boolean,
        name?: string,
        consumerid?: string,
        environment?: string
    }

    // These will override what's in rhsm.conf
    declare export type RegisterConnectionOptions = {
        host?: string,        // the subscription management server host
        port?: number,        // the subscription management server port
        handler?: string,     // the context of the subscription management server. E.g. /subscriptions
        insecure?: boolean,   // disable TLS/SSL host verification
        proxy_hostname?: string,
        proxy_user?: string,
        proxy_password?: string
    }

    declare export class Proxy {
        call(name: string, args: ?any[], sig?: {type: string}): Promise<any>;
        wait(fn?: () => any): Promise<any>;
    }

    declare export class RegisterServerProxy extends Proxy {
        Start(): string;
        Stop(): boolean;
    }

    declare export class UnregisterProxy extends Proxy {
        Unregister(args: any): Promise<boolean>;
    }

    declare export class RegisterProxy extends Proxy {
        Register(...args: any[]): Promise<string>;
    }

    declare export class ConfigProxy extends Proxy {
        Get(name: string): Promise<{t: string, v: string}>;
        Set(name: string, val: string): Promise<void>;
    }

    declare export class Service {
        wait(fn?: () => any): Promise<any>;
        proxy( iface: string, obj: string): any;
    }
}
