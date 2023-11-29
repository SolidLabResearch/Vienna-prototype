//@ts-ignore
import * as pack from "./package"

import * as n3  from 'n3';
import * as rdf from 'rdf-js';
import {RDFC10, Quads } from 'rdfjs-c14n';

import * as crypto from 'crypto';

export async function signContent(content: string, issuer: string, privateKey: crypto.webcrypto.CryptoKey) {

    let quadArray = n3toQuadArray(content)
    let signature = await signDataGraph(quadArray, privateKey)
   
    let signatureString = Buffer.from(signature).toString('base64') 

    return pack.packageContent(content, {
        sign: {
            signature: signatureString,
            issuer: issuer,
        },
    })

}


export function n3toQuadArray(message: string) {
    return new n3.Parser({format: "text/n3"}).parse(message)
}

async function hashDataGraph(input: rdf.Quad[]) {
    // Any implementation of the data factory will do in the call below.
    // By default, the Data Factory of the `n3` package (i.e., the argument in the call
    // below is not strictly necessary).
    // Optionally, an instance of a Dataset Core Factory may be added as a second argument.
    const rdfc10 = new RDFC10(n3.DataFactory);  

    // "normalized" is a dataset of quads with "canonical" blank node labels
    // per the specification. 
    const normalized: Quads = (await rdfc10.c14n(input)).canonicalized_dataset;

    // If you care only of the N-Quads results only, you can make it simpler
    // const normalized_N_Quads: string = (await rdfc10.c14n(input)).canonical_form;

    // Or even simpler, using a shortcut:
    // const normalized_N_Quads_bis: string = await rdfc10.canonicalize(input);

    // "hash" is the hash value of the canonical dataset, per specification
    const hash: string = await rdfc10.hash(normalized);

    return new TextEncoder().encode(hash);
}

async function signDataGraph(input: rdf.Quad[], privateKey: crypto.webcrypto.CryptoKey) {
    let signature = await sign(privateKey, await hashDataGraph(input));

    // console.log('signature', signature)

    // let signatureString = Buffer.from(signature).toString('base64')
    // console.log('signatur2', signatureString)
    
    // let signatureReturn = Buffer.from(signatureString, 'base64')
    // console.log('signatur3', signatureReturn)

    return signature
}

export async function verifyDataGraph(input: rdf.Quad[], signature: ArrayBuffer, publicKey: crypto.webcrypto.CryptoKey) {
    return verify(publicKey, signature, await hashDataGraph(input))
}

export const generateKeyPair = async function() {
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

export const verify = async function(publicKey: crypto.webcrypto.CryptoKey, signature: ArrayBuffer, data: crypto.webcrypto.BufferSource) {
    return crypto.subtle.verify({
      name: 'ECDSA',
      hash: 'SHA-512'
    }, publicKey, signature, data );
};
