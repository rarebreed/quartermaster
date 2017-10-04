/**@flow
 * This is the spec file for the test/lib/functions.  These should be unit tests
 */

import { setInput } from "../lib/test-helpers"
import { launch } from "../../src/lib/spawn"
import Rx from "rxjs/Rx"




describe("Cockpit API tests => ", () => {
    it("Tests the spawn command", (done) => {
        // I think I need to use cockpit.spawn() and run a cp and mv command. 
        let {result$, output$} = launch(["ls", "-al", "/home/stoner"]);
        output$.subscribe(console.log);
        result$.subscribe({
            next: (res: SpawnResult) => {
                console.log(res);
                expect(res.exit_status).toBe(0);
                done();
            },
            error: (err: SpawnResult) => console.error(err)
        })
    }) 
})