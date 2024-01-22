import express from 'express'
import bodyParser from 'body-parser';
import { PolicyStore } from '../../Util/Storage';
import { Server} from 'http';
import { serializeCryptoKey } from '../../Util/Util';
import { EndpointInfo, IdentityServiceInfo, ServiceInfo } from '../..';
import { PublicInterface } from '../PublicInterface';

export class IdentityInterface extends PublicInterface {
    
    webId?: string;
    podId?: string;
    keyPair?: CryptoKeyPair;

    endpointInfo: EndpointInfo;

    constructor(info: ServiceInfo, endpointInfo: EndpointInfo) {
        super(info);
        this.endpointInfo = endpointInfo;
    }

    public async start(port: number): Promise<void> {
        this.webId = `http://localhost:${port}/${this.info.podId}/id`
        this.keyPair = this.info.keyPair;
        this.podId = this.info.podId;
        
        let app = await this.runInterface()
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

    private async runInterface() {

        if (!this.keyPair) throw new Error('KeyPair not instantiated.')

        const app = express()

        const keyString = await serializeCryptoKey(this.keyPair.publicKey)

        app.get(`/${this.podId}/id`, async (req: any, res: any) => {
        
            let webIdString = 
`@prefix : <http://example.org/ns/>.
@prefix foaf: <http://xmlns.com/foaf/0.1/>.
@prefix solid: <http://www.w3.org/ns/solid/terms#>.
@prefix pim: <http://www.w3.org/ns/pim/space#>.

<${this.webId}> a foaf:Person;
    foaf:name "${this.info.podId}"@en;
    solid:oidcIssuer <${this.info.IDPServerId}>;
    pim:storage <${this.endpointInfo.dataEndpoint}>;
    :dataEndpoint <${this.endpointInfo.dataEndpoint}>;
    :adminEndpoint <${this.endpointInfo.adminEndpoint}>;
    :logEndpoint <${this.endpointInfo.logEndpoint}>;
    :authZEndpoint <${this.endpointInfo.authZEndpoint}>;
    <http://www.w3.org/ns/auth/cert#key>  "${keyString}".
`
            res.status(200).contentType('text/turtle').send(webIdString)

        })
        
        return app;
    }
}