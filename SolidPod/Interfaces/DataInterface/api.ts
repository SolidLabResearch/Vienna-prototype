//@ts-ignore
import * as pack from "../../Util/packaging/package"
import * as n3  from 'n3';
import * as crypto from 'crypto';
import { n3toQuadArray, signContent } from "../../Util/packaging/createSignedPackage";
import { write } from '@jeswr/pretty-turtle';
import { AuthZToken } from "../../../SolidLib/Interface/ISolidLib";
import express from 'express';
import { Server} from 'http';
import { PublicInterface } from "../PublicInterface";
import { ServiceInfo } from "../..";
import { DataStorageComponent } from "../../Components/Storage/DataStorageComponent";




export class DataInterface extends PublicInterface {

    private storageComponent: DataStorageComponent;

    constructor(info: ServiceInfo, storageComponent: DataStorageComponent) {
        super(info);
        this.storageComponent = storageComponent;
    }

    public async start(port: number) {
        let app = await this.runInterface(port);
        this.server = app.listen(port, () => {
            console.log(`Data Interface listening on ${port}`)
            console.log(`http://localhost:${port}/${this.info.podId}/endpoint`)
        })
    }

    public async stop(){
        this.server?.close();
    }




    private async runInterface(port: number) {

        const app = express()

        app.use(express.text({ type: ['text/n3'] }));

        const endpoint = `http://localhost:${port}/${this.info.podId}/endpoint`

        app.post(`/${this.info.podId}/endpoint`, async (req: any, res: any) => {

            // Check AuthZToken
            try {
                // note: verification token is stubbed
                if (!req.headers.authorization) {
                    res
                    .status(401)
                    .contentType("application/json")
                    .send({ error: "No Auth Token" })
                    return
                }

                const authHeader : string = req.headers.authorization
                if (authHeader !== "Bearer verySecretToken.Allowed-to-read-dob.") throw new Error('Invalid AuthZ token')

                console.log(`[${new Date().toISOString()}] - [DataInterface]: AuthZ token: OK.`);
            } catch (e) {
                console.error(`No valid AuthZ token presented: ${e}`)
                res
                .status(401)
                .contentType("application/json")
                .send({ error: "No Auth Token" })
                return
            }

            // Processing request message
            
            let body = req.body
            let match;

            try {
                let parser = new n3.Parser({format: "text/n3"}) 
                match = await parser.parse(body)
            } catch (e) {
                res.status(400)
                res.send('Please provide a valid RDF triple as a request.\n')
                return
            }

            if (!match || match.length !== 1) {
                res.status(400)
                res.send('Please provide a single triple as a match for the request body.\n')
                return;
            }
            let matchTriple = match[0]

            // Get data from storage component

            let matchingData = await this.storageComponent.getData(matchTriple)
            
            // 8. Serialize the package structure using Jesse's magic lib
            let packageString = await write(matchingData, {format: "text/n3", prefixes: {
                "pack": "https://example.org/ns/package#",
                "policy": "https://example.org/ns/policy#",
                "sign": "https://example.org/ns/signature#",
            }});

            // Remove empty lines
            packageString = packageString.replace(/(^[ \t]*\n)/gm, "")


            // Package the government data in the correct provenance
            let provenanceWrappedPackage = await pack.packageContent(packageString, {
                // actor: this.info.webId, // TODO:: This should not be the WebID -> either endpoint or delete
                origin: endpoint,
                purpose: "https://gdpr.org/purposes/Research", // TODO:: We need to link this to the agreement purpose
            })

            // Sign the package as the Pod
            let signedPackage = await signContent(provenanceWrappedPackage, this.info.webId, this.info.keyPair.privateKey)
            
            // Send the response
            res.status(200).contentType('text/n3').send(signedPackage)
        })

        return app
    }


}


