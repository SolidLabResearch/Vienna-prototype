import express from 'express'
import bodyParser from 'body-parser';
import { PolicyStore } from '../../Util/Storage';
import { Server} from 'http';
const app = express()
const port = 8060
app.use(bodyParser.text({ type: 'text/n3' }));

const LoggedTransactions = []

app.post('/', async (req, res) => {

    let body = req.body
    // check for AuthZ token
    if (!req.headers.authorization) {
        console.log(`[${new Date().toISOString()}] - Admin: No AuthZ token.`);
        res
            .status(401)
            .contentType("application/json")
            .send({ error: "No AuthZ Token" })
        return
    }

    if (req.headers.authorization !== "Bearer verySecretToken.Allowed-to-add-policy") { // proper verification needs to happen here (pref communication to authz server)
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

    policyStore.write(req.body, new Date().valueOf() + '.ttl')
    console.log(`[${new Date().toISOString()}] - Admin: Writing Policy to Policy Store.`);

    res
        .status(200)
        .contentType("application/json")
        .send({ info: "Policy added" })
})


export class LogInterface{
    private server: Server | undefined;
    public start(port: number): void{
        this.server = app.listen(port, () => {
            console.log(`Admin Interface listening on ${port}`)
            console.log(`URI: http://localhost:${port}/`)
        })
    }
    public stop():void {
        this.server?.close();
    }
}