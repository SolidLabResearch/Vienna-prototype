import express from 'express'
import bodyParser from 'body-parser';
import { LogStore, PolicyStore } from '../../Util/Storage';
import { Server} from 'http';
import { Agreement } from '../../../SolidLib/Interface/ISolidLib';
import * as n3 from "n3"
import { PublicInterface } from '../PublicInterface';
import { ServiceInfo } from '../..';
import { LogStorageComponent } from '../../Components/Storage/LogStorageComponent';

export class LogInterface extends PublicInterface {
    app?: express.Application;
    server: Server | undefined;
    store: LogStorageComponent;

    constructor(info: ServiceInfo, store: LogStorageComponent) {
        super(info)
        this.store = store;
    }


    public async start(port: number){
        this.app = express();
        await this.startService()

        this.server = this.app.listen(port, () => {
            console.log(`Log Interface listening on ${port}`)
            console.log(`URI: http://localhost:${port}/`)
        })
    }

    public async stop() {
        this.server?.close();
    }

    private startService() {
        if (!this.app) throw new Error("Coult not start service. Server setup was not finished.")
        this.app.use(bodyParser.text({ type: /*'text/n3'*/ "application/json" }));

        this.app.post('/', async (req, res) => {
            // Note: the post is only for internal calls (not for the owner/other apps)
            let body = req.body
        
            console.log(`[${new Date().toISOString()}] - LogInterface: Storing Agreement.`);

            let storageObject = { date: new Date(), agreement: JSON.parse(body) as Agreement}

            this.store.addLogEntry([])
            
            res
                .status(200)
                .contentType("application/json")
                .send({ info: "Log added" })
        })


        this.app.get ('/', async (req, res) => {
            //   check for AuthZ token
            if (!req.headers.authorization) {
                console.log(`[${new Date().toISOString()}] - LogInterface: No AuthZ token.`);
                res
                    .status(401)
                    .contentType("application/json")
                    .send({ error: "No AuthZ Token" })
                return
            }

            if (req.headers.authorization !== "Bearer verySecretToken.Allowed-to-read-agreements") { // proper verification needs to happen here (pref communication to authz server)
                // incorrect token
                console.log(`[${new Date().toISOString()}] - LogInterface: Incorrect AuthZ token.`);
                console.log(req.headers.authorization)
                res
                    .status(401)
                    .contentType("application/json")
                    .send({ error: "Incorrect AuthZ Token" })
                return
            }
        
            console.log(`[${new Date().toISOString()}] - LogInterface: Getting Agreement.`);

            let logEntries = await this.store.getLogs()
            res
                .status(200)
                .contentType("application/json")
                .send(logEntries)
        })
    }
}