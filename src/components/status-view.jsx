/** @flow @jsx html
 * Contains the DOM view of the status of the system
 * This includes if the system is registered or not, a (un)Register button, and a list of installed products
 */
import { html } from 'snabbdom-jsx';
const cockpit = require("cockpit");
const _ = cockpit.gettext;

export type Status = "registered" | "unknown" | "registering" | "unregistering";

export const StatusView = (status: Status) => {
    let btnTxt = (status === "registered") ? "Register" : "Unregister";
    
    return (
        <div>
          <label>Status:</label>
          {` the system is ${status}`}
          <button id="register-btn">Register</button>
        </div>
    );
}

export function makeTableRow(row: string, value: string) {
    return <tr key={row}><td className="form-tr-ct-title">{_(row)}</td><td><span>{value}</span></td></tr>
}

export function installedProduct(rows: Array<Array<string>>) {
    return (
        <div>
            {rows.map(row => {
                makeTableRow(row[0], row[1])
            })}
        </div>
    )
}