import { program } from "commander"
import { SolidLib } from './SolidLib/Interface/SolidLib';
import { setup } from './setup';
import { DataPlusPlus } from "./SolidLib/Interface/ISolidLib";
import { n3reasoner } from "eyereasoner/dist";
import { DataFactory, Parser, Store } from "n3";
import { write } from "@jeswr/pretty-turtle/dist";

var solidLib = new SolidLib("interactive-client", 'steve');

program
    .command('addpolicy')
    .argument('policy', 'Policy string')
    .action(async (policy) => {
        await solidLib.login()
        await solidLib.addPolicy(policy)
        console.log('')
        console.log('Policy added')
        await solidLib.logout();
    })



program
    .command('getdata')
    .argument('query', 'Query string')
    .option('-t, --trusted', 'return only trusted data')
    .option('-s, --stripped', 'return only trusted data')
    .action(async (query, options) => {
        await solidLib.login()

        let data: DataPlusPlus;
        let dataString: string;

        if (options.trusted) {
            data = await solidLib.getDataWithTrust(query, [ "verification", "advertisement" ])
            dataString = data.data.data
        } else {
            data = await solidLib.getData(query, [ "verification", "advertisement" ])
            if (options.stripped) {
                dataString = await flattenPackageStructure(data.data.data)
            } else {
                dataString = data.data.data
            }
        }

        if (options.stripped) {
            await flattenPackageStructure(dataString)
        }

        console.log(
`
Data
${dataString}

Agreement
${JSON.stringify(data.agreements, null, 2)}
`
        )

        await solidLib.logout();
    })


program
.command('getlog')
    .action(async () => {
        await solidLib.login();

        let logEntries = await solidLib.getLogEntries()
        console.log('')
        console.log('Log Entries:')
        for (let entry of logEntries) {
            console.log(
`
Date: 
${entry.date}
Agreement:
${JSON.stringify(entry.agreement, null, 2)}
`
            )
        }

        await solidLib.logout();
    })



async function run() {
    
    const close = await setup('steve')

    await new Promise(resolve => setTimeout(resolve, 1000));

    program.parse(process.argv)


    // Wait for keypress to close

    const keypress = async () => {
        process.stdin.setRawMode(true)
        return new Promise<void>(resolve => process.stdin.once('data', () => {
        process.stdin.setRawMode(false)
        resolve()
        }))
    }
    
    ;(async () => {
        await keypress()
    })().then(async() => {
        console.log('Endpoints closed by keypress')
        await close();
        process.exit()
    })

    
}



async function flattenPackageStructure(data: string): Promise<string> {

    let rule = `
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
    } => ?content .
    `
    let input = rule + data;

    const reasoningResult = await n3reasoner(input);


    const reasonedStore = new Store(new Parser({ format: 'text/n3' }).parse(reasoningResult));

    const resultingData = [...reasonedStore.match(null, null, null, DataFactory.defaultGraph())].filter(
        term => (term.object.termType !== 'BlankNode' || reasonedStore.match(null, null, null, term.object as any).size === 0)
            && !term.predicate.equals(DataFactory.namedNode('https://example.org/ns/package#assertedBy'))
    )

    const resultingDataString = await write(resultingData, {
        format: 'text/n3'
    })


    return resultingDataString;
}




run()

