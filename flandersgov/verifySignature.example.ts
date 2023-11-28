import { Parser, Store } from 'n3';

import { validateSignatures } from '../packaging/validateSignatures';

async function main() {
  const webId = 'http://example.org/jeswr'
  const text = await fetch(`http://localhost:3456/flandersgov/endpoint/dob?id=${webId}`);
  const data = new Store(new Parser({ format: 'text/n3' }).parse(await text.text()));
  await validateSignatures(data);
}

main();
