//@ts-ignore
import * as pack from "./package"

import * as n3  from 'n3';
import * as rdf from 'rdf-js';
import {RDFC10, Quads } from 'rdfjs-c14n';

import { subtle, webcrypto } from 'crypto';

export async function signContent(content: string, issuer: string, privateKey: webcrypto.CryptoKey) {
    let signature = await signDataGraph(n3toQuadArray(content), privateKey)
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
    const rdfc10 = new RDFC10(n3.DataFactory);
    const normalized: Quads = (await rdfc10.c14n(input)).canonicalized_dataset;
    const hash: string = await rdfc10.hash(normalized);
    return new TextEncoder().encode(hash);
}

async function signDataGraph(input: rdf.Quad[], privateKey: webcrypto.CryptoKey) {
    return sign(privateKey, await hashDataGraph(input));
}

export async function verifyDataGraph(input: rdf.Quad[], signature: ArrayBuffer, publicKey: webcrypto.CryptoKey) {
    return verify(publicKey, signature, await hashDataGraph(input))
}

const keyParams = {
    name: "ECDSA",
    namedCurve: "P-384",
}

const signParams = {
    name: keyParams.name,
    hash: 'SHA-512'
}

export function generateKeyPair() {
    return subtle.generateKey(keyParams, true, ["sign", "verify"]);
}

export function importKey(key: string) {
    return subtle.importKey("raw", Buffer.from(key, 'base64'), keyParams, true, ["verify"]);
}

function sign(privateKey: webcrypto.CryptoKey, buffer: webcrypto.BufferSource) {
    return subtle.sign(signParams, privateKey, buffer);
};

function verify(publicKey: webcrypto.CryptoKey, signature: ArrayBuffer, data: webcrypto.BufferSource) {
    return subtle.verify(signParams, publicKey, signature, data );
};
