import express from 'express';
import { n3reasoner } from 'eyereasoner';
import { Store } from 'n3';
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
  
  const reasoned = await n3reasoner(
    `<https://www.jeswr.org/#me> :asserts { :Ruben :age 27 . 27 <http://www.w3.org/2000/10/swap/math#GreaterThan> 18 . } .`,
    `{ ${wrapped} } => { ${wrapped} } .`
  )

  res.status(200).contentType('text/n3').send(reasoned);
})

app.listen(3000);
