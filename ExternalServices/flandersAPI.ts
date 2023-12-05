import express from 'express';
const app = express()
const port = 3456

import * as n3  from 'n3';

import * as crypto from 'crypto';

import { signContent, generateKeyPair, createContentSignatureFromN3String } from "../SolidPod/Util/packaging/createSignedPackage"
import { packageContentString } from '../packaging/package';


export async function run() {

    const baseURI = `http://localhost:${port}` 
    const govid = `http://localhost:${port}/flandersgov/id`

    let keypair = await generateKeyPair();

    let publicKeyRaw = await crypto.subtle.exportKey("raw", keypair.publicKey)
    let publicKeyString = Buffer.from(publicKeyRaw).toString('base64')

    app.get('/flandersgov/endpoint/dob', async (req, res) => {
        let id = req.query.id
        
        if (typeof id !== 'string') {
            return res.status(500).send("id must be a string")
        }
        
        let bdateTriple = n3.DataFactory.quad(
            n3.DataFactory.namedNode(id), 
            n3.DataFactory.namedNode("https://www.w3.org/2006/vcard/ns#bday"), 
            n3.DataFactory.literal(new Date('2000-01-01T10:00:00').toISOString(), n3.DataFactory.namedNode("http://www.w3.org/2001/XMLSchema#dateTime"))
        );

        let tripleString : string = await new Promise((resolve, reject) => {
            const writer = new n3.Writer({}); // Create a writer which uses `c` as a prefix for the namespace `http://example.org/cartoons#`
            writer.addQuad(bdateTriple)
            writer.end((error: any, result: any) => { resolve(result) });
        })

        let signature = await createContentSignatureFromN3String(tripleString, keypair.privateKey)

        let packagedContent = await packageContentString(tripleString, {
            sign: {
                issuer: govid,
                value: signature
            },
            origin: baseURI + `/flandersgov/endpoint/dob`,
        })

        res.status(200).contentType('text/n3').send(packagedContent)
    })

    app.get('/flandersgov/endpoint/name', async (req, res) => {
        let id = req.query.id
        
        if (typeof id !== 'string') {
            return res.status(500).send("id must be a string")
        }
        
        let bdateTriple = new n3.Writer({}).quadToString(
            n3.DataFactory.namedNode(id), 
            n3.DataFactory.namedNode("http://xmlns.com/foaf/0.1/name"), 
            n3.DataFactory.literal("Bob The Builder")
        );

        let signature = await createContentSignatureFromN3String(bdateTriple, keypair.privateKey)

        let packagedContent = await packageContentString(bdateTriple, {
            sign: {
                issuer: govid,
                value: signature
            },
            origin: baseURI + `/flandersgov/endpoint/name`,
        })

        res.status(200).contentType('text/n3').send(packagedContent)
    })


    app.get('/flandersgov/endpoint/address', async (req, res) => {
        let id = req.query.id
        
        if (typeof id !== 'string') {
            return res.status(500).send("id must be a string")
        }

        
        let triples = [
            n3.DataFactory.quad(
                n3.DataFactory.namedNode(id), 
                n3.DataFactory.namedNode("https://www.w3.org/2006/vcard/ns#hasAddress"), 
                n3.DataFactory.blankNode("address"),
            ), n3.DataFactory.quad(
                n3.DataFactory.blankNode("address"),
                n3.DataFactory.namedNode("https://www.w3.org/2006/vcard/ns#street-address"), 
                n3.DataFactory.literal("Technologiepark-Zwijnaarde 122 ")
            ),  n3.DataFactory.quad(
                n3.DataFactory.blankNode("address"),
                n3.DataFactory.namedNode("https://www.w3.org/2006/vcard/ns#locality"), 
                n3.DataFactory.literal("Ghent")
            ), n3.DataFactory.quad(
                n3.DataFactory.blankNode("address"),
                n3.DataFactory.namedNode("https://www.w3.org/2006/vcard/ns#postal-code"), 
                n3.DataFactory.literal(9052)
            ), n3.DataFactory.quad(
                n3.DataFactory.blankNode("address"),
                n3.DataFactory.namedNode("https://www.w3.org/2006/vcard/ns#country-name"), 
                n3.DataFactory.literal("Belgium")
            ),
        ]

        let tripleString : string = await new Promise((resolve, reject) => {
            const writer = new n3.Writer({}); // Create a writer which uses `c` as a prefix for the namespace `http://example.org/cartoons#`
            writer.addQuads(triples)
            writer.end((error: any, result: any) => { resolve(result) });
        })

        let signature = await createContentSignatureFromN3String(tripleString, keypair.privateKey)

        let packagedContent = await packageContentString(tripleString, {
            sign: {
                issuer: govid,
                value: signature
            },
            origin: baseURI + `/flandersgov/endpoint/address`,
        })

        res.status(200).contentType('text/n3').send(packagedContent)
    })


    app.get('/flandersgov/id', async (req, res) => {

        let webId = 
`@prefix foaf: <http://xmlns.com/foaf/0.1/>.

<${govid}> a foaf:PublicInstance;
    foaf:name "Flanders Government"@en;
    foaf:homepage <https://www.vlaanderen.be>;
    <http://www.w3.org/ns/auth/cert#key>  "${publicKeyString}".
`
        res.status(200).contentType('text/turtle').send(webId)
    })


    return app.listen(port, () => {
        console.log(
`Running government birthdate API system

identity document URI:
${govid}


name endpoint URI:
http://localhost:${port}/flandersgov/endpoint/name?id=<webid>

birthdate endpoint URI:
http://localhost:${port}/flandersgov/endpoint/dob?id=<webid>

address endpoint URI:
http://localhost:${port}/flandersgov/endpoint/address?id=<webid>`
        )
    })

}

