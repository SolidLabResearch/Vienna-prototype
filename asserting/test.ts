async function main() {
  const data = await fetch('http://localhost:3000/neg', {
    // method: 'POST',
    // // body: 'hello world',
    // body: JSON.stringify({a: 1, b: 2}),
    // headers: {
    //   "Content-Type": "text/n3",
    // },
    method: 'POST',
    headers: {
      'Accept': 'text/n3',
      'Content-Type': 'text/n3',
      'user-agent': 'https://www.jeswr.org/#me'
    },
    // body: JSON.stringify({a: 1, b: 'Textual content'})
    // body: ':Ruben :age _:X . _:X math:GreaterThan 18 .'
    body: ':Ruben :age _:X . _:X <http://www.w3.org/2000/10/swap/math#GreaterThan> 18 .'
  });

  console.log(await data.text())
}

main();
