import express from 'express';
const app = express()
const port = 3457

import * as n3  from 'n3';

import * as crypto from 'crypto';

import { signContent, generateKeyPair } from "../SolidPod/Util/packaging/createSignedPackage"


async function run() {

    const compid = `http://localhost:${port}/company/id`

    let keypair = await generateKeyPair();

    let publicKeyRaw = await crypto.subtle.exportKey("raw", keypair.publicKey)
    let publicKeyString = Buffer.from(publicKeyRaw).toString('base64')

    app.get('/company/endpoint/licensekey', async (req, res) => {
        let id = req.query.id
        
        
        if (typeof id !== 'string') {
            return res.status(500).send("id must be a string")
        }

        
        let triple = n3.DataFactory.quad(
            n3.DataFactory.namedNode(id), 
            n3.DataFactory.namedNode("https://www.company.be/namespace/licensekey"), 
            n3.DataFactory.literal((Math.random() + 1).toString(36).substring(2))
        );

        let tripleString : string = await new Promise((resolve, reject) => {
            const writer = new n3.Writer({}); // Create a writer which uses `c` as a prefix for the namespace `http://example.org/cartoons#`
            writer.addQuad(triple)
            writer.end((error: any, result: any) => { resolve(result) });
        })

        let content = await signContent(tripleString, compid, keypair.privateKey)

        res.status(200).contentType('text/n3').send(content)
    })

    app.get('/company/id', async (req, res) => {

        let webId = 
`@prefix foaf: <http://xmlns.com/foaf/0.1/>.

<${compid}> a foaf:Company;
    foaf:name "Company X"@en;
    foaf:homepage <https://www.companyX.be>;
    <http://www.w3.org/ns/auth/cert#key>  "${publicKeyString}".
`
        res.status(200).contentType('text/turtle').send(webId)
    })


    app.listen(port, () => {
        console.log(
`Running Company API

identity document URI:
${compid}

licensekey endpoint URI:
http://localhost:${port}/company/endpoint/licensekey?id=<webid>`
        )
    })

}


run()