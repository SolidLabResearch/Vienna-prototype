//@ts-ignore
import * as pack from "./package"

import { n3reasoner } from 'eyereasoner';

import * as n3  from 'n3';
import * as rdf from 'rdf-js';
import {RDFC10, Quads } from 'rdfjs-c14n';

import * as crypto from 'crypto';




let content = `
<https://pod.rubendedecker.be/profile/card#me> <http://www.w3.org/2006/vcard/ns#bday> "2000-01-01T10:00:00"^^<http://www.w3.org/2001/XMLSchema#dateTime> .
`

export async function signContent(content: string, issuer: string, privateKey: crypto.webcrypto.CryptoKey) {

    let quadArray = await n3toQuadArray(content)
    let signature = await signDataGraph(quadArray, privateKey)
   
    let signatureString = Buffer.from(signature).toString('base64') 

    let signedPackage = pack.packageContent(content, {
        sign: {
            signature: signatureString,
            issuer: issuer,
        },
    })

    return (signedPackage)

}


function n3toQuadArray(message: string) {
    let parsed = new n3.Parser({format: "text/n3"}).parse(message)
    return parsed
}

async function signDataGraph (input: rdf.Quad[], privateKey: crypto.webcrypto.CryptoKey) {

    // Any implementation of the data factory will do in the call below.
    // By default, the Data Factory of the `n3` package (i.e., the argument in the call
    // below is not strictly necessary).
    // Optionally, an instance of a Dataset Core Factory may be added as a second argument.
    const rdfc10 = new RDFC10(n3.DataFactory);  

    // "normalized" is a dataset of quads with "canonical" blank node labels
    // per the specification. 
    const normalized: Quads = (await rdfc10.c14n(input)).canonicalized_dataset;

    // If you care only of the N-Quads results only, you can make it simpler
    const normalized_N_Quads: string = (await rdfc10.c14n(input)).canonical_form;

    // Or even simpler, using a shortcut:
    const normalized_N_Quads_bis: string = await rdfc10.canonicalize(input);

    // "hash" is the hash value of the canonical dataset, per specification
    const hash: string = await rdfc10.hash(normalized);

    let signature = await sign(privateKey, new TextEncoder().encode(hash))

    // console.log('signature', signature)

    // let signatureString = Buffer.from(signature).toString('base64')
    // console.log('signatur2', signatureString)
    
    // let signatureReturn = Buffer.from(signatureString, 'base64')
    // console.log('signatur3', signatureReturn)

    return signature
}



const generateKeyPair = async function() {
    return crypto.subtle.generateKey(
        {
            name: "ECDSA",
            namedCurve: "P-384",
        },
        true,
        ["sign", "verify"]
    );
}

const sign = async function(privateKey: crypto.webcrypto.CryptoKey, buffer: crypto.webcrypto.BufferSource) {
    return crypto.subtle.sign({
      name: 'ECDSA',
      hash: 'SHA-512'
    }, privateKey, buffer);
};

const verify = async function(publicKey: crypto.webcrypto.CryptoKey, signature: ArrayBuffer, data: crypto.webcrypto.BufferSource) {
    return crypto.subtle.verify({
      name: 'ECDSA',
      hash: 'SHA-512'
    }, publicKey, signature, data );
};






// packageAndSignContent(content, )
