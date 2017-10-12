//@flow
//import { DOMSource } from  "@cycle/dom";
import Rx from "rxjs/Rx";

declare module "quartermaster" {
    declare export class Proxy {
        call(name: string, args: any[] | {}, sig?: {type: string}): Promise<any>;
        wait(fn?: () => any): Promise<any>;
    }

    declare export class Service {
        proxy(iface: string, obj: string): Proxy;
    }
}
