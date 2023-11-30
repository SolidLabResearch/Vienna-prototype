import express from 'express'
import bodyParser from 'body-parser';
import { LogStore, PolicyStore } from '../../Util/Storage';
import { Server} from 'http';
import { Agreement } from '../../../SolidLib/Interface/ISolidLib';
import * as n3 from "n3"

const app = express()
const port = 8030
app.use(bodyParser.text({ type: /*'text/n3'*/ "application/json" }));

const logStore = new LogStore()

app.post('/', async (req, res) => {
    // Note: the post is only for internal calls (not for the owner/other apps)
    let body = req.body
  
    console.log(`[${new Date().toISOString()}] - LogInterface: Storing Agreement.`);

    let storageObject = { date: new Date(), agreement: JSON.parse(body) as Agreement}

    logStore.write(JSON.stringify(storageObject, null, 2), new Date().valueOf()+'.json')
    
    res
        .status(200)
        .contentType("application/json")
        .send({ info: "Log added" })
})


app.get ('/', async (req, res) => {
      // check for AuthZ token
    //   if (!req.headers.authorization) {
    //     console.log(`[${new Date().toISOString()}] - LogInterface: No AuthZ token.`);
    //     res
    //         .status(401)
    //         .contentType("application/json")
    //         .send({ error: "No AuthZ Token" })
    //     return
    // }

    // if (req.headers.authorization !== "Bearer verySecretToken.Allowed-to-read-agreements") { // proper verification needs to happen here (pref communication to authz server)
    //     // incorrect token
    //     console.log(`[${new Date().toISOString()}] - LogInterface: Incorrect AuthZ token.`);
    //     console.log(req.headers.authorization)
    //     res
    //         .status(401)
    //         .contentType("application/json")
    //         .send({ error: "Incorrect AuthZ Token" })
    //     return
    // }
  
    console.log(`[${new Date().toISOString()}] - LogInterface: Getting Agreement.`);

    let logEntries = logStore.readAllJSON()
    res
        .status(200)
        .contentType("application/json")
        .send(logEntries)
})

export class LogInterface{
    private server: Server | undefined;
    public start(port: number): void{
        this.server = app.listen(port, () => {
            console.log(`Log Interface listening on ${port}`)
            console.log(`URI: http://localhost:${port}/`)
        })
    }
    public stop():void {
        this.server?.close();
    }
}