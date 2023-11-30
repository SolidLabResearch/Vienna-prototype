import express from 'express'
import bodyParser from 'body-parser';
import { PolicyStore } from '../../Util/Storage';
import { Server} from 'http';
import { Agreement } from '../../../SolidLib/Interface/ISolidLib';
const app = express()
const port = 8030
app.use(bodyParser.text({ type: /*'text/n3'*/ "application/json" }));

const loggedTransactions : {date: Date, agreement: Agreement}[] = []

app.post('/', async (req, res) => {

    let body = req.body
  
    console.log(`[${new Date().toISOString()}] - LogInterface: Storing Agreement.`);
    loggedTransactions.push({ date: new Date(), agreement: JSON.parse(body) as Agreement})
    res
        .status(200)
        .contentType("application/json")
        .send({ info: "Log added" })
})


app.get ('/', async (req, res) => {
  
    console.log(`[${new Date().toISOString()}] - LogInterface: Getting Agreement.`);

    let log = JSON.stringify(loggedTransactions)
    res
        .status(200)
        .contentType("application/json")
        .send(log)
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