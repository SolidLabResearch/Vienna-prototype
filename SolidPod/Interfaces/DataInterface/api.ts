//@ts-ignore
import * as pack from "../../Util/packaging/package"
import * as n3  from 'n3';
import * as crypto from 'crypto';
import { n3toQuadArray, signContent } from "../../Util/packaging/createSignedPackage";
import { write } from '@jeswr/pretty-turtle';
import express from 'express';

const app = express()

app.use(express.text({
  type: ['text/n3', 'text/turtle', 'text/plain']
}));


let tripleStore = new n3.Store();

const packagePredicate = "https://example.org/ns/package#packages"
const contentPredicate = "https://example.org/ns/package#content"

export async function runInterface(port: number) {

    let name = process.argv[2]

    name = name || "bob"


    const webid = `http://localhost:${port}/${name}/id`
    const endpoint = `http://localhost:${port}/${name}/endpoint`

    await prefetch(webid);


    // Create keypair for the data pod

    let keypair = await crypto.subtle.generateKey(
        {
            name: "ECDSA",
            namedCurve: "P-384",
        },
        true,
        ["sign", "verify"]
    );

    let publicKeyRaw = await crypto.subtle.exportKey("raw", keypair.publicKey)
    let publicKeyString = Buffer.from(publicKeyRaw).toString('base64')

    // The Dialog endpoint, a get request will trigger an error
    app.get(`/${name}/endpoint`, async (req: any, res: any) => {

        res.status(400)

        res.send("Please do a POST request to this endpoint with the dialog message as body")
    })

    app.post(`/${name}/endpoint`, async (req: any, res: any) => {
        let body = req.body
        let match;

        try {
            let parser = new n3.Parser({format: "text/n3"}) 
            match = await parser.parse(body)
        } catch (e) {
            res.status(400)
            res.send('Please provide a valid RDF triple as a request.\n')
            return
        }

        if (!match || match.length !== 1) {
            res.status(400)
            res.send('Please provide a single triple as a match for the request body.\n')
            return;
        }
        let matchTriple = match[0]

        let quads = await getPackageQuadsFromMatch(tripleStore, matchTriple)

        if (!quads || quads.length === 0) {
            res.status(500)
            res.send('\nNo matches found for your request\n')
            return;
        }

        // 8. Serialize the package structure using Jesse's magic lib
        let packageString = await write(quads, {format: "text/n3", prefixes: {
            "pack": "https://example.org/ns/package#",
            "policy": "https://example.org/ns/policy#",
            "sign": "https://example.org/ns/signature#",
        }});

        // Remove empty lines
        packageString = packageString.replace(/(^[ \t]*\n)/gm, "")


        // Package the government data in the correct provenance
        let provenanceWrappedPackage = await pack.packageContent(packageString, {
            packagedBy: webid,
            packagedFrom: endpoint,
            purpose: "https://gdpr.org/purposes/Research",
        })

        // Sign the package as the Pod
        let signedPackage = await signContent(provenanceWrappedPackage, webid, keypair.privateKey)
        
        // Send the response
        res.status(200).contentType('text/n3').send(signedPackage)
    })

    app.get(`/${name}/id`, async (req: any, res: any) => {

        let webId = 
`@prefix foaf: <http://xmlns.com/foaf/0.1/>.

<${webid}> a foaf:Person;
    foaf:name "${name}"@en;
    <http://www.w3.org/ns/auth/cert#key>  "${publicKeyString}".
`
        res.status(200).contentType('text/turtle').send(webId)
    })


    return app.listen(port, () => {
        console.log(
`Running Pod API system

Identity document URI:
${webid}

Dialog endpoint URI:
${endpoint}`
        )
    })



}

async function prefetch(webId: string) {
    tripleStore.addQuads( await n3toQuadArray( await (await fetch(`http://localhost:3456/flandersgov/endpoint/dob?id=${webId}`)).text() ) )
    tripleStore.addQuads( await n3toQuadArray( await (await fetch(`http://localhost:3456/flandersgov/endpoint/name?id=${webId}`)).text() ) )
    tripleStore.addQuads( await n3toQuadArray( await (await fetch(`http://localhost:3456/flandersgov/endpoint/address?id=${webId}`)).text() ) )
    tripleStore.addQuads( await n3toQuadArray( await (await fetch(`http://localhost:3457/company/endpoint/licensekey?id=${webId}`)).text() ) )
} 

/**
 * 
 * 1. Find the graph value of the quad
 * 2. check if the graph value is the object of a << [] pack:content _:graph _:packageGraph >> quad.
 * 3. Get the root by getting the << [] pack:package _:packageGraph _:outerGraph >> quad.
 * 4. If the _:outerGraph quad is not the default graph, repeat the process.
 * 5. When we come to the root package (the graph value is the default graph), we need to retrieve the whole package structure.
 * 6. We do this through a flood fill, of taking a list of ALL package graphs
 * 7a. Emit all quads that are part of the package graph.
 * 7b. Find the content graph, and emit all quads part of that content graph.
 * 7c. If the content graph contains a package, repeat
 * 8. Serialize the package structure using Jesse's magic lib
 * 
 */

async function getPackageQuadsFromMatch(store: n3.Store, match: n3.Quad) : Promise<n3.Quad[]> {

    let rootPackages: n3.Quad[] = []
    
    // 1. Find the graph value of the quad
    let subject = match.subject.termType === "Variable" ? null : match.subject ;
    let predicate = match.predicate.termType === "Variable" ? null : match.predicate ;
    let object = match.object.termType === "Variable" ? null : match.object ;
    let matches = store.getQuads(subject, predicate, object, null);
    if (!matches || matches.length === 0) return []

    while (matches.length) {
        let newMatches: n3.Quad[] = []
        for (let match of matches) {
            // 5. When we come to the root package (the graph value is the default graph), we need to retrieve the whole package structure.
            if ( match.graph.equals(n3.DataFactory.defaultGraph()) ) {
                rootPackages.push(match);
                continue;
            }

            // 2. Check if the graph value is the object of a << [] pack:content _:graph _:packageGraph >> quad.
            let contentTriples = store.getQuads(null, contentPredicate, match.graph, null)
            let contentTriple = contentTriples && contentTriples.length ? contentTriples[0] : undefined
            if (!contentTriple) continue;

            // 3. Get the root by getting the << [] pack:package _:packageGraph _:outerGraph >> quad.
            let packageShellTriples = store.getQuads(null, packagePredicate, contentTriple.graph, null)
            let packageShellTriple = packageShellTriples && packageShellTriples.length ? packageShellTriples[0] : undefined
            if (!packageShellTriple) continue;

            newMatches.push(packageShellTriple)
        }    
        // 4. If the _:outerGraph quad is not the default graph, repeat the process.
        matches = newMatches;
    }

    let dataGraph : n3.Quad[] = []

    // 6. We do this through a flood fill, of taking a list of ALL package graphs
    for (let rootPackage of rootPackages) {
        dataGraph = dataGraph.concat(rootPackage)
        dataGraph = dataGraph.concat(extractSubgraphFromStore(store, rootPackage.object))
    }   

    return dataGraph
    
}

function extractSubgraphFromStore(store: n3.Store, graph: n3.Term): n3.Quad[] {
    let subgraphQuads: n3.Quad[] = []
    // 7a. Emit all quads that are part of the package graph.
    let graphQuads = store.getQuads(null, null, null, graph);
    if (!graphQuads || graphQuads.length === 0) return []

    subgraphQuads = subgraphQuads.concat(graphQuads);

    for (let quad of graphQuads) {
        subgraphQuads = subgraphQuads.concat(extractSubgraphFromStore(store, quad.object))
    }

    return subgraphQuads;
}
