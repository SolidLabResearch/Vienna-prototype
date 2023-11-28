import { n3reasoner } from 'eyereasoner';

import * as n3  from 'n3';
import * as rdf from 'rdf-js';
// The definition of "Quads" is:
// export type Quads = rdf.Quad[] | Set<rdf.Quad>; 
import {RDFC10, Quads } from 'rdfjs-c14n';

import * as crypto from 'crypto';




async function run() {
    
    // const queryString = `
    // @prefix : <http://example.org/socrates#>.

    // {:Socrates a ?WHAT} => {:Socrates a ?WHAT}.
    // `;

    // const dataString = `
    // @prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>.
    // @prefix : <http://example.org/socrates#>.

    // :Socrates a :Human.
    // :Human rdfs:subClassOf :Mortal.

    // {?A rdfs:subClassOf ?B. ?S a ?A} => {?S a ?B}.
    // `;

    // // The result of the query (as a string)
    // const resultString = await n3reasoner(dataString, queryString);

    // // All inferred data
    // // const resultString = await n3reasoner(dataString);

    // console.log(resultString)

    let stringToParse = `
        @prefix : <http://example.org/> .
        @prefix pack: <https://example.org/ns/package#>.
        @prefix xsd: <http://www.w3.org/2001/XMLSchema#>.

        @prefix : <http://example.org/> .
        @prefix pack: <https://example.org/ns/package#>.


        [] pack:packages {
            [] 
                pack:packagedBy :Ruben;
                pack:packagedFrom :RubenDataPod;
                pack:packagedAt "2023-07-09"^^xsd:date;
                pack:contains {
                    :WebID :name "Ruben D.".
                }.
        }.
    `;
    
    let messageQuads = await n3toQuadArray(stringToParse);
    // console.log(messageQuads)

    let hash = await hashDataGraph(messageQuads)
    console.log(hash)

}

function n3toQuadArray(message: string) {
    let parsed = new n3.Parser({format: "text/n3"}).parse(message)
    return parsed
}

async function hashDataGraph (input: rdf.Quad[]) {

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



    let keypair = await generateKeyPair()

    let signature = await sign(keypair.privateKey, new TextEncoder().encode(hash))

    console.log('signature', signature)
    
    let verification = await verify(keypair.publicKey, signature, new TextEncoder().encode(hash))
   
    
    console.log('verification', verification)


    return hash
}









run()




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