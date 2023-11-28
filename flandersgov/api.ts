const express = require('express')
const app = express()
const port = 3456

import * as n3  from 'n3';

import * as crypto from 'crypto';

import { signContent } from "../packaging/createSignedPackage";


async function run() {

    const govid = `http://localhost:${port}/flandersgov/id`

    let keypair = await crypto.subtle.generateKey(
        {
            name: "ECDSA",
            namedCurve: "P-384",
        },
        true,
        ["sign", "verify"]
    );

    let publicKeyRaw = await crypto.subtle.exportKey("raw", keypair.publicKey)
    let publicKeyString = Buffer.from(publicKeyRaw).toString('base64')

    //@ts-ignore
    app.get('/flandersgov/endpoint/dob', async (req, res) => {
        let id = req.query.id
        console.log(id)

        
        let bdateTriple = n3.DataFactory.quad(
            n3.DataFactory.namedNode(id), 
            n3.DataFactory.namedNode("https://www.w3.org/2006/vcard/ns#bday"), 
            n3.DataFactory.literal(new Date('2000-01-01T10:00:00').toISOString(), new n3.NamedNode("http://www.w3.org/2001/XMLSchema#dateTime"))
        );

        let tripleString : string = await new Promise((resolve, reject) => {
            const writer = new n3.Writer({}); // Create a writer which uses `c` as a prefix for the namespace `http://example.org/cartoons#`
            writer.addQuad(bdateTriple)
            writer.end((error: any, result: any) => { resolve(result) });
        })

        
        console.log('triple', tripleString)

        let content = await signContent(tripleString, govid, keypair.privateKey)

        res.send(content)
    })


    //@ts-ignore
    app.get('/flandersgov/id', async (req, res) => {

        let webId = 
`@prefix foaf: <http://xmlns.com/foaf/0.1/>.

<${govid}> a foaf:PublicInstance;
    foaf:name "Flanders Government"@en;
    foaf:homepage <https://www.vlaanderen.be>;
    <http://www.w3.org/ns/auth/cert#key>  "${publicKeyString}".
`
        res.send(webId)
    })


    app.listen(port, () => {
        console.log(
`Running government birthdate API system

identity document URI:
${govid}

birthdate endpoint URI:
http://localhost:${port}/flandersgov/endpoint/dob?id=<webid>`
        )
    })

}


run()