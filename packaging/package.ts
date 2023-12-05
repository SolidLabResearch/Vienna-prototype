import { BlankNode, DataFactory, Parser, Quad } from "n3";
import { write } from "@jeswr/pretty-turtle"

const fs = require('fs');
const DF = DataFactory

const pack = "https://example.org/ns/package#"
const policy = "https://example.org/ns/policy#"
const sign = "https://example.org/ns/signature#"
const xsd = "http://www.w3.org/2001/XMLSchema#"
const odrl = "http://www.w3.org/ns/odrl/2/"
const dcterms = "http://purl.org/dc/terms/"

type PackageOptions = {
    actor?: string,          // Actor responsible for the packaging
    origin?: string,         // Origin of the packaged data
    documentUri?: string,    // URI of the document -- TODO:: remove this and make inverse relation
    contentType?: string,    // content type of the content
    policy?: {               // Policies of the content
        duration: string,   // Duration for which the receiving actor can use the data, takes a XSD duration
        purpose: string,    // Purpose of the packaging - Usage Policy, takes a URL input of the purpose
        issuer: string,     // Issuer of the signature
    },
    sign?: {                 // Signature of the content
        value: string,      // Signature value
        issuer: string,     // Issuer of the signature
    },
    quads?: Quad[],          // Replaces the blankNode with name value "package" for the package blank node
}

// const resultingDataString = await write(resultingData, {
//     format: 'text/n3'
// })

// const reasonedStore = new Store(new Parser({ format: 'text/n3' }).parse(reasoningResult));

export async function packageContentFile(path: string, options: PackageOptions) {
    let n3string = fs.readFileSync(path, {encoding: "utf-8"});
    let quads = new Parser({ format: 'text/n3' }).parse(n3string);
    return processContent(quads, options)
};


export async function packageContentString(n3string: string, options: PackageOptions) { 
    let quads = new Parser({ format: 'text/n3' }).parse(n3string);
    return processContent(quads, options)
}

export async function packageContentQuads(quads: Quad[], options: PackageOptions) { 
    return processContent(quads, options)
}

async function processContent(quads: Quad[], options: PackageOptions): Promise<string> {
    
    let packageGraph = DF.blankNode()
    let packageBlankNode = DF.blankNode();
    let contentGraph = DF.blankNode()

    let packageQuads : Quad[] = [
        DF.quad( DF.blankNode(), DF.namedNode(pack+"package"), packageGraph, DF.defaultGraph() ),
        DF.quad( packageBlankNode, DF.namedNode(pack+"content"), contentGraph, packageGraph ),
    ];

    // Adding content quads, by changing the default grapg for the content graph
    packageQuads = packageQuads.concat( 
        quads.map(q => 
            q.graph.equals(DF.defaultGraph()) 
                ? DataFactory.quad(q.subject, q.predicate, q.object, contentGraph) 
                : q
        ) 
    )
    
    packageQuads = packageQuads.concat(addProvenance(packageBlankNode, packageGraph, options))
    packageQuads = packageQuads.concat(addPolicy(packageBlankNode, packageGraph, options))
    packageQuads = packageQuads.concat(addSignature(packageBlankNode, packageGraph, options))
    packageQuads = packageQuads.concat(addCustomQuads(packageBlankNode, packageGraph, options))

    let stringResult = await write(packageQuads, {
        format: 'text/n3'
    })

    return stringResult
}

function addProvenance(packageBlankNode: BlankNode, packageGraph: BlankNode, options: PackageOptions): Quad[] {
    let metadata: Quad[] = []
    if(options.actor) metadata.push(DF.quad(packageBlankNode, DF.namedNode(pack+"actor"), DF.namedNode(options.actor), packageGraph))
    if(options.origin) metadata.push(DF.quad(packageBlankNode, DF.namedNode(pack+"origin"), DF.namedNode(options.origin), packageGraph))
    if(options.origin) metadata.push(DF.quad(packageBlankNode, DF.namedNode(pack+"createdAt"), DF.literal(new Date().toISOString(), DF.namedNode(xsd+"dateTime")), packageGraph))
    return metadata;
}


function addPolicy(packageBlankNode: BlankNode, packageGraph: BlankNode, options: PackageOptions): Quad[] {
    let metadata: Quad[] = []

    if (!options.policy) return []

    let policyBlankNode = DF.blankNode();
    let permissionBlankNode = DF.blankNode();

    let constraintBlankNodes: BlankNode[] = []
    

    // Add duration constraint
    if (options.policy.duration) {
        let constraintBlankNode = DF.blankNode();
        metadata = metadata.concat([
            DF.quad(constraintBlankNode, DF.namedNode(odrl+"leftOperand"), DF.namedNode(odrl+"elapsedTime"), packageGraph),
            DF.quad(constraintBlankNode, DF.namedNode(odrl+"operator"), DF.namedNode(odrl+"eq"), packageGraph),
            DF.quad(constraintBlankNode, DF.namedNode(odrl+"rightOperand"), DF.literal(options.policy.duration, DF.namedNode(xsd+"duration")), packageGraph),
        ])
        constraintBlankNodes.push(constraintBlankNode);
    }
        
    // add purpose constraint
    if (options.policy.purpose) {
        let constraintBlankNode = DF.blankNode();
        metadata = metadata.concat([
            DF.quad(constraintBlankNode, DF.namedNode(odrl+"leftOperand"), DF.namedNode("https://w3id.org/oac#Purpose"), packageGraph),
            DF.quad(constraintBlankNode, DF.namedNode(odrl+"operator"), DF.namedNode(odrl+"eq"), packageGraph),
            DF.quad(constraintBlankNode, DF.namedNode(odrl+"rightOperand"), DF.literal(options.policy.purpose), packageGraph),
        ])
        constraintBlankNodes.push(constraintBlankNode);
    }

    metadata = metadata.concat([
        DF.quad(packageBlankNode, DF.namedNode(pack+"hasContentPolicy"), policyBlankNode, packageGraph),

        DF.quad(policyBlankNode, DF.namedNode(dcterms+"creator"), DF.literal(options.policy.issuer), packageGraph),
        DF.quad(policyBlankNode, DF.namedNode(dcterms+"issued"), DF.literal(new Date().toISOString(), DF.namedNode(xsd+"dateTime")), packageGraph),
        DF.quad(policyBlankNode, DF.namedNode(dcterms+"permission"), permissionBlankNode, packageGraph),

        DF.quad(permissionBlankNode, DF.namedNode(odrl+"action"), DF.namedNode(odrl+"use"), packageGraph),
    ])
    for (let constraintBlankNode of constraintBlankNodes) {
        metadata = metadata.concat([
            DF.quad(permissionBlankNode, DF.namedNode(odrl+"constraint"), constraintBlankNode, packageGraph),
        ])
    }
    return metadata;
}


function addSignature(packageBlankNode: BlankNode, packageGraph: BlankNode, options: PackageOptions): Quad[] {
    let metadata: Quad[] = []

    const signatureBlankNode = DF.blankNode();
    if (options.sign) {
        metadata = metadata.concat([
            DF.quad(packageBlankNode, DF.namedNode(pack+"hasContentSignature"), signatureBlankNode, packageGraph),
            DF.quad(signatureBlankNode, DF.namedNode("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"), DF.namedNode(sign+"Signature"), packageGraph),
            DF.quad(signatureBlankNode, DF.namedNode(sign+"issuer"), DF.namedNode(options.sign.issuer), packageGraph),
            DF.quad(signatureBlankNode, DF.namedNode(sign+"created"), DF.literal(new Date().toISOString(), DF.namedNode(xsd+"dateTime")), packageGraph),
            DF.quad(signatureBlankNode, DF.namedNode(sign+"proofValue"), DF.literal(options.sign.value), packageGraph),
        ])
    }
    return metadata
}

/**
 * note: This function interchanges a quad with a SUBJECT BLANK NODE value of "package" to the package blank node
 */
function addCustomQuads(packageBlankNode: BlankNode, packageGraph: BlankNode, options: PackageOptions): Quad[] {
    let metadata: Quad[] = []

    if (options.quads) {
        metadata = options.quads.map(q => DF.quad(
            q.subject.equals(DF.blankNode('package')) ? packageBlankNode : q.subject,
            q.predicate,
            q.object,
            packageGraph
        ))
    }
    return metadata
}
