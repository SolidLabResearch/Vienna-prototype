import express from 'express'
import bodyParser from 'body-parser';
import { PolicyStore } from '../../Util/Storage';
import { Server} from 'http';
import { serializeCryptoKey } from '../../Util/Util';

export class IdentityInterface{
    
    webId?: string;
    podId?: string;
    keyPair?: CryptoKeyPair

    private server: Server | undefined;
    public async start(port: number, podId: string, keyPair: CryptoKeyPair): Promise<void> {
        this.webId = `http://localhost:${port}/${podId}/id`
        this.keyPair = keyPair;
        this.podId = podId;
        
        let app = await this.runInterface()
        this.server = app.listen(port, () => {
            console.log(`Identity Interface (WebId) listening on ${port}`)
            console.log("WebId:", this.webId)
        })
    }

    public stop():void {
        this.server?.close();
    }

    public getWebId(): string | undefined {
        return this.webId;
    }

    private async runInterface() {

        if (!this.keyPair) throw new Error('KeyPair not instantiated.')

        const app = express()

        const keyString = serializeCryptoKey(this.keyPair.publicKey)

        app.get(`/${this.podId}/id`, async (req: any, res: any) => {
        
            let webIdString = 
`@prefix foaf: <http://xmlns.com/foaf/0.1/>.

<${this.webId}> a foaf:Person;
foaf:name "${name}"@en;
<http://www.w3.org/ns/auth/cert#key>  "${keyString}".
`
            res.status(200).contentType('text/turtle').send(webIdString)

        })
        
        return app;
    }
}