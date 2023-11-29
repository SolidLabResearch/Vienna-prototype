import express from 'express';
const app = express()
const port = 3123

//@ts-ignore
import * as pack from "../packaging/package"

import * as n3  from 'n3';

import * as crypto from 'crypto';

import { n3toQuadArray, signContent } from "../packaging/createSignedPackage";

const createGovernmentEndpointRequest = async (webId: string) => await (await fetch(`http://localhost:3456/flandersgov/endpoint/dob?id=${webId}`)).text()

app.use(express.text({
  type: ['text/n3', 'text/turtle', 'text/plain']
}));


let tripleStore = new n3.Store();



async function run() {

    let name = process.argv[2]

    name = name || "bob"


    const webid = `http://localhost:${port}/${name}/id`
    const endpoint = `http://localhost:${port}/${name}/endpoint`


    let bdatePackage = await createGovernmentEndpointRequest(webid);
    let quads = await n3toQuadArray(bdatePackage)
    tripleStore.addQuads(quads)


    // Create keypair for the data pod

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

    // The Dialog endpoint, a get request will trigger an error
    app.get(`/${name}/endpoint`, async (req, res) => {

        res.status(400)

        res.send("Please do a POST request to this endpoint with the dialog message as body")
    })

    app.post(`/${name}/endpoint`, async (req, res) => {
        let body = req.body
        console.log("request body", body)

        // Prefetching government data
        let bdatePackage = await createGovernmentEndpointRequest(webid);
        console.log('data', bdatePackage)


        // Package the government data in the correct provenance
        let packagedBdate = await pack.packageContent(bdatePackage, {
            packagedBy: webid,
            packagedFrom: endpoint,
            purpose: "https://gdpr.org/purposes/Research",
        })

        // Sign the package as the Pod
        let signedPackage = await signContent(packagedBdate, webid, keypair.privateKey)
        
        // Send the response
        res.status(200).contentType('text/n3').send(signedPackage)
    })

    app.get(`/${name}/id`, async (req, res) => {

        let webId = 
`@prefix foaf: <http://xmlns.com/foaf/0.1/>.

<${webid}> a foaf:Person;
    foaf:name "${name}"@en;
    <http://www.w3.org/ns/auth/cert#key>  "${publicKeyString}".
`
        res.status(200).contentType('text/turtle').send(webId)
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

// function getMatchFromTripleStore(store: n3.Store, match: n3.Quad)


run()