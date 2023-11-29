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
  const bobEndpoint = 'http://localhost:8040/bob/endpoint';

  const res = await fetch(bobEndpoint, {
    method: 'POST',
    headers: {
      'Accept': 'text/n3',
      'Content-Type': 'text/n3',
      'user-agent': 'https://www.jeswr.org/#me'
    },
    // body: '?S ?P ?O .'
    body: '<http://localhost:8040/bob/id> <https://www.w3.org/2006/vcard/ns#bday> ?O .'
  });

  const extractedContent = new Store();
  const store = new Store(new Parser({ format: 'text/n3' }).parse(await res.text()));

  for (const data of store.match(null, DF.namedNode('https://example.org/ns/package#packages'), null, DF.defaultGraph())) {
    store.add(
      DF.quad(
        data.subject,
        DF.namedNode('https://example.org/ns/package#assertedBy'),
        DF.namedNode(bobEndpoint),
        DF.defaultGraph()
      )
    )
  }


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

  await validateSignatures(store);
  const reasoningResult = await n3reasoner([await write([...store], {
    format: 'text/n3',
    prefixes
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
  `, trust]);

  console.log('='.repeat(100))
  console.log('The packaged data is:')
  console.log(await write([...store], {
    format: 'text/n3',
    prefixes
  }))
  console.log('='.repeat(100))

  const reasonedStore = new Store(new Parser({ format: 'text/n3' }).parse(reasoningResult));

  const data = [...reasonedStore.match(null, null, null, DF.defaultGraph())].filter(
    term => term.object.termType !== 'BlankNode' || reasonedStore.match(null, null, null, term.object as any).size === 0
  )
  
  console.log('The merged data is:')
  console.log(await write(data, {
    format: 'text/n3'
  }))
}

unpackage();
