import { Parser, Store, DataFactory } from 'n3';
import * as crypto from 'crypto';
import { Quad } from '@rdfjs/types';
import { verifyDataGraph } from "./createSignedPackage";

const { namedNode, defaultGraph, quad, literal } = DataFactory;

async function getPubKey(issuer: string) {
  const text = await fetch(issuer);
  const data = new Store(new Parser().parse(await text.text()));

  const objects = data.getObjects(namedNode(issuer), namedNode('http://www.w3.org/ns/auth/cert#key'), defaultGraph());
  if (objects.length !== 1) {
    throw new Error("Expected exactly one public key");
  }

  if (objects[0].termType !== 'Literal') {
    throw new Error("Not a literal");
  }

  return await crypto.subtle.importKey("raw", Buffer.from(objects[0].value, 'base64'), {
    name: "ECDSA",
    namedCurve: "P-384",
  }, true, ['verify']);
}
export async function validateSignatures(data: Store) {
  for (const { subject, object, graph } of data.match(null, namedNode('https://example.org/ns/signature#hasContentSignature'), null)) {

    const pub = await getPubKey(data.getObjects(object, namedNode('https://example.org/ns/signature#issuer'), graph)[0].value);
    const [content] = data.getObjects(subject, 'https://example.org/ns/package#content', graph);
    const signature = data.getObjects(object, 'https://example.org/ns/signature#proofValue', graph)[0].value;

    const quads: Quad[] = [];

    for (const { subject, predicate, object } of data.match(null, null, null, content)) {
      quads.push(quad(subject, predicate, object));
    }

    if (await verifyDataGraph(quads, Buffer.from(signature, 'base64'), pub)) {
      data.add(
        quad(
          subject,
          namedNode('https://example.org/ns/signature#signatureHasBeenVerified'),
          literal('true', namedNode('http://www.w3.org/2001/XMLSchema#boolean')),
          graph
        )
      );
    }
  }
}
