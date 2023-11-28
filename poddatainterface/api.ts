const express = require('express')
const app = express()
const port = 3123

import * as n3  from 'n3';

import * as crypto from 'crypto';

import { signContent } from "../packaging/createSignedPackage";

const createGovernmentEndpointRequest = async (webId) => await (await fetch(`http://localhost:${port}/flandersgov/endpoint/dob?id=${webId}`)).text()


async function run() {

    let name = process.argv[2]

    name = name || "bob"

    const webid = `http://localhost:${port}/${name}/id`
    const endpoint = `http://localhost:${port}/${name}/endpoint`

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
    app.get(`/${name}/endpoint`, async (req, res) => {
        res.send("Please do a POST request to this endpoint with the dialog message as body")
    })

    //@ts-ignore
    app.post(`/${name}/endpoint`, async (req, res) => {
        let body = req.query.id
        console.log(body)

        
        let content = "Hello World \n"
        res.send(content)
    })


    //@ts-ignore
    app.get(`/${name}/id`, async (req, res) => {

        let webId = 
`@prefix foaf: <http://xmlns.com/foaf/0.1/>.

<${webid}> a foaf:Person;
    foaf:name "${name}"@en;
    <http://www.w3.org/ns/auth/cert#key>  "${publicKeyString}".
`
        res.send(webId)
    })


    app.listen(port, () => {
        console.log(
`Running Pod API system

Identity document URI:
${webid}

Dialog endpoint URI:
${endpoint}`
        )
    })

}


run()