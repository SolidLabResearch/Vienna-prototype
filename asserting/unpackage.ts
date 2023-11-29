import { n3reasoner } from 'eyereasoner';
import { Store, Parser, DataFactory as DF } from 'n3';
import { Term } from '@rdfjs/types';
import { write } from '@jeswr/pretty-turtle';
import { validateSignatures } from '../packaging/validateSignatures';

const prefixes = {
  pack: 'https://example.org/ns/package#',
  odrl: 'http://www.w3.org/ns/odrl/2/',
  sign: 'https://example.org/ns/signature#',
  dc: 'http://purl.org/dc/terms/',
  xsd: 'http://www.w3.org/2001/XMLSchema#',
  vcard: 'https://www.w3.org/2006/vcard/ns#',
  policy: 'https://example.org/ns/policy#'
}

async function unpackage() {
  const bobEndpoint = 'http://localhost:3123/bob/endpoint';

  const res = await fetch(bobEndpoint, {
    method: 'POST',
    headers: {
      'Accept': 'text/n3',
      'Content-Type': 'text/n3',
      'user-agent': 'https://www.jeswr.org/#me'
    },
    body: ':Ruben :age _:X .'
  });

  const extractedContent = new Store();
  const store = new Store(new Parser({ format: 'text/n3' }).parse(await res.text()));

  // This is the data living in the users global context
  // const trustStore = new Store(new Parser({ format: 'text/n3' }).parse(`
  //   @prefix : <http://example.org/> .
  //   @prefix rot: <https://purl.org/krdb-core/rot/rot#> .

  //   :globals :user :Jesse .
  //   :Jesse rot:trusts <http://localhost:3456/flandersgov/id> .
  // `));

  const trust = `
    @prefix : <http://example.org/> .
    @prefix rot: <https://purl.org/krdb-core/rot/rot#> .

    :globals :user :Jesse .
    :Jesse rot:trusts <http://localhost:3456/flandersgov/id> .
  `

  console.log(store.size);
  await validateSignatures(store);
  console.log(store.size)

  console.log(await write([...store], {
    format: 'text/n3',
    prefixes
  }));

  const allData = new Store([...extractedContent, ...store]);

  // This should be the job of a reasoner [bring all verified signatures to the top]
  // for (const { subject, predicate, graph } of allData.match(null, DF.namedNode('https://example.org/ns/signature#signatureHasBeenVerified'), null)) {
  //   const [signaure] = allData.getObjects(subject, DF.namedNode('https://example.org/ns/signature#hasContentSignature'), graph);
  //   const [issuer] = allData.getObjects(signaure, DF.namedNode('https://example.org/ns/signature#issuer'), graph);
  //   // allData.getObjects()

  //   const g = DF.blankNode();
  //   allData.add(DF.quad(
  //     DF.blankNode(),
  //     DF.namedNode('https://example.org/ns/package#packages'),
  //     g,
  //     DF.defaultGraph()
  //   ))

  //   for (const data of allData.match(subject as any, null, null, graph as any)) {
  //     console.log(data)
  //     allData.add(
  //       DF.quad(
  //         data.subject,
  //         data.predicate,
  //         data.object,
  //         g
  //       )
  //     )
  //   }

  //   console.log(await write([...store], {
  //     format: 'text/n3', prefixes
  //   }))

  //   // const r = allData.getSubjects(DF.namedNode('https://example.org/ns/package#content'), signaure, graph);

  //   // const g = DF.blankNode();

  //   // allData.add(DF.quad(
  //   //   DF.blankNode(),
  //   //   DF.namedNode('https://example.org/ns/package#packages'),
  //   //   DF.blankNode(),
  //   // ))
  // }

  console.log(await n3reasoner([await write([...store], {
    format: 'text/n3',
  }), `
  @prefix log: <http://www.w3.org/2000/10/swap/log#> .
  @prefix dcterms: <http://purl.org/dc/terms/>.
  @prefix odrl: <http://www.w3.org/ns/odrl/2/>.
  @prefix pack: <https://example.org/ns/package#>.
  @prefix policy: <https://example.org/ns/policy#>.
  @prefix sign: <https://example.org/ns/signature#>.
  @prefix xsd: <http://www.w3.org/2001/XMLSchema#>.
  @prefix rot: <https://purl.org/krdb-core/rot/rot#> .
  @prefix : <http://example.org/> .

  {
    ?pack pack:packages ?package .
    ?package log:includes { [] pack:content ?content } .
    ?content log:includes { [] pack:packages ?p1 } .
  } => {
    [] pack:flatPackages ?p1
  } .

  {
    ?pack pack:packages ?package .
  } => {
    [] pack:flatPackages ?package
  } .

  {
    ?pack pack:flatPackages ?package .
    ?package log:includes { [] pack:content ?content } .
    ?content log:includes { [] pack:packages ?p1 } .
  } => {
    [] pack:flatPackages ?p1
  } .

  {
    ?pack pack:flatPackages ?package .
    ?package log:includes {
      [] sign:signatureHasBeenVerified true;
        sign:hasContentSignature [
          sign:issuer ?issuer
        ]  
    } .
  } => {
    [] pack:packages ?package ;
      pack:assertedBy ?issuer .
  } . 
  
  {
    ?pack pack:packages ?package .
    ?package log:includes { [] pack:content ?content } .

    ?pack pack:assertedBy ?issuer .
    :globals :user [ 
      rot:trusts ?issuer 
    ] .
  } => ?content .
  `, trust]));
}

unpackage();
