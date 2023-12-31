import express from 'express'
import bodyParser from 'body-parser';
import { PolicyStore } from '../../Util/Storage';
import { Server} from 'http';
import { serializeCryptoKey } from '../../Util/Util';
import { IdentityServiceInfo, ServiceInfo } from '../..';
import { PublicInterface } from '../PublicInterface';

export class IdentityInterface extends PublicInterface {
    
    webId?: string;
    podId?: string;
    keyPair?: CryptoKeyPair;

    storageURL: string;

    constructor(info: ServiceInfo, storageURL: string) {
        super(info);
        this.storageURL = storageURL;
    }

    public async start(port: number): Promise<void> {
        this.webId = `http://localhost:${port}/${this.info.podId}/id`
        this.keyPair = this.info.keyPair;
        this.podId = this.info.podId;
        
        let app = await this.runInterface(this.storageURL)
        this.server = app.listen(port, () => {
            console.log(`Identity Interface (WebId) listening on ${port}`)
            console.log("WebId:", this.webId)
        })
    }

    public async stop() {
        this.server?.close();
    }

    public getWebId(): string | undefined {
        return this.webId;
    }

    private async runInterface(storageURL: string) {

        if (!this.keyPair) throw new Error('KeyPair not instantiated.')

        const app = express()

        const keyString = await serializeCryptoKey(this.keyPair.publicKey)

        app.get(`/${this.podId}/id`, async (req: any, res: any) => {
        
            let webIdString = 
`@prefix foaf: <http://xmlns.com/foaf/0.1/>.
@prefix pim: <http://www.w3.org/ns/pim/space#>.

<${this.webId}> a foaf:Person;
    foaf:name "${this.info.podId}"@en;
    pim:storage <${storageURL}>;
    <http://www.w3.org/ns/auth/cert#key>  "${keyString}".
`
            res.status(200).contentType('text/turtle').send(webIdString)

        })
        
        return app;
    }
}