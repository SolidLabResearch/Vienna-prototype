import express from 'express'
import bodyParser from 'body-parser';
import { Server} from 'http';
import { PublicInterface } from '../PublicInterface';
import { ServiceInfo } from '../..';
import { PolicyStorageComponent } from '../../Components/Storage/PolicyStorageComponent';


export class AdminInterface extends PublicInterface{
    app?: express.Application;
    server: Server | undefined;
    store: PolicyStorageComponent;

    constructor(info: ServiceInfo, store: PolicyStorageComponent) {
        super(info)
        this.store = store;

    }

    public async start(port: number){
        this.app = express();

        this.startService(port)
    }
    public async stop() {
        this.server?.close();
    }

    private async startService(port: number) {
        if (!this.app) throw new Error("Coult not start service. Server setup was not finished.")
        this.app.use(bodyParser.text({ type: 'text/turtle' }));

        // const policyStore = new PolicyStore()

        this.app.post('/', async (req, res) => {
            // check for AuthZ token
            if (!req.headers.authorization) {
                console.log(`[${new Date().toISOString()}] - Admin: No AuthZ token.`);
                res
                    .status(401)
                    .contentType("application/json")
                    .send({ error: "No AuthZ Token" })
                return
            }

            if (req.headers.authorization !== "Bearer solid.policy-add") { // proper verification needs to happen here (pref communication to authz server)
                // incorrect token
                console.log(`[${new Date().toISOString()}] - Admin: Incorrect AuthZ token.`);
                res
                    .status(401)
                    .contentType("application/json")
                    .send({ error: "Incorrect AuthZ Token" })
                return
            }

            if (req.body.constructor === Object && Object.keys(req.body).length === 0) {
                res.status(400)
                .contentType("application/json")
                .send({ error: "No body" })
                return
            }


            console.log(`[${new Date().toISOString()}] - Admin: Correct AuthZ token.`);

            console.log("BODY", req.body)
            // this.store.addPolicy(req.body, )
            console.log(`[${new Date().toISOString()}] - Admin: Writing Policy to Policy Store.`);

            res
                .status(200)
                .contentType("application/json")
                .send({ info: "Policy added" })
        })

        this.server = this.app.listen(port, () => {
            console.log(`Authorization Interface listening on ${port}`)
            console.log(`URI: http://localhost:${port}/`)
          })
    }
}