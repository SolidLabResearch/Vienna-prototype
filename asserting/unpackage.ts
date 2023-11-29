import { n3reasoner } from 'eyereasoner';
import { Store, Parser } from 'n3';
import { write } from '@jeswr/pretty-turtle';
import { validateSignatures } from '../packaging/validateSignatures';

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

  const store = new Store(new Parser({ format: 'text/n3' }).parse(await res.text()));

  console.log(store.size);
  await validateSignatures(store);
  console.log(store.size)

  console.log(await write([...store], {
    format: 'text/n3',
    prefixes: {
      pack: 'https://example.org/ns/package#',
      odrl: 'http://www.w3.org/ns/odrl/2/',
      sign: 'https://example.org/ns/signature#',
      dc: 'http://purl.org/dc/terms/',
      xsd: 'http://www.w3.org/2001/XMLSchema#',
      vcard: 'https://www.w3.org/2006/vcard/ns#',
      policy: 'https://example.org/ns/policy#'
    }
  }));


  
  // n3reasoner(data)?
}

unpackage();
