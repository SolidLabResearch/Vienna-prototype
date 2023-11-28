import express from 'express';
import { n3reasoner } from 'eyereasoner';
import { Quad } from '@rdfjs/types';
import { Store, Parser } from 'n3';

function parse(str: string): Quad[] {
  return new Parser({ format: 'text/n3' }).parse(str);
}

const data = `
@prefix : { ${req.body} } .

<https://www.jeswr.org/#me> :asserts { :Ruben :age 27 . 27 <http://www.w3.org/2000/10/swap/math#GreaterThan> 18 . } .`;

// import {  } '@rdfjs/express-handler';

const app = express();

// app.use(require('@rdfjs/express-handler'))

app.use(express.text({
  type: ['text/n3', 'text/plain']
}));

// express.

app.post('/neg', async (req, res) => {
  // req.on('data', console.log)
  console.log(req.body, req.headers);
  const wrapped = `<${req.headers['user-agent']}> :asserts { ${req.body} }`;
  console.log(
    `{ ${wrapped} } => { ${wrapped} } .`
  )

  console.log(
    parse(data)
  )
  
  const reasoned = await n3reasoner(
    data,
    `{ ${wrapped} } => { ${req.body} } .`
    // `<${req.headers['user-agent']}> :asserts { ${req.body} }`
  )

  res.status(200).contentType('text/n3').send(reasoned);
})

app.listen(3000);
