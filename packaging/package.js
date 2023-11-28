const fs = require('fs');
const readline = require('readline');

const spacingToken = '  '
const singleSpacing = spacingToken
const doubleSpacing = spacingToken+spacingToken
const tripleSpacing = spacingToken+spacingToken+spacingToken


const headers = `
@prefix pack: <https://example.org/ns/package#>.
@prefix policy: <https://example.org/ns/policy#>.
@prefix sign: <https://example.org/ns/signature#>.
@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.
@prefix odrl: <http://www.w3.org/ns/odrl/2/>.
@prefix dcterms: <http://purl.org/dc/terms/>.
`

/**
 * 
 * @param {string} path // Path of file to package
 * @param {Object} options 
 * @param {string=} options.packagedBy // Actor responsible for the packaging
 * @param {string=} options.packagedFrom // Origin of the packaged data
 * @param {string=} options.duration // Duration for which the receiving actor can use the data, takes a XSD duration
 * @param {string=} options.purpose // Purpose of the packaging - Usage Policy, takes a URL input of the purpos
 * @param {string=} options.documentUri // URI of the document -- TODO:: remove this and make inverse relation
 * @param {string=} options.contentType // content type of the content
 * @param {string=} options.shape // Shape of the content
 * @param {Object=} options.sign // Signature of the content
 * @param {string=} options.sign.signature // Signature value
 * @param {string=} options.sign.issuer // Issuer of the signature
 * 
 * @returns 
 */
exports.packageFileContent = async function packageFileContent(path, options) {
    let lines = await new Promise((resolve, reject) => {
        let lines = []

        const file = readline.createInterface({
            input: fs.createReadStream(path),
            output: process.stdout,
            terminal: false
        });
        
        file.on('line', (line) => {
            lines.push(line);
        })
        file.on('close', () => { resolve(lines) })
    })
    return processContent(lines, options)
};


/**
 * 
 * @param {string} content // content to be packaged
 * @param {Object} options 
 * @param {string=} options.packagedBy // Actor responsible for the packaging
 * @param {string=} options.packagedFrom // Origin of the packaged data
 * @param {string=} options.duration // Duration for which the receiving actor can use the data, takes a XSD duration
 * @param {string=} options.purpose // Purpose of the packaging - Usage Policy, takes a URL input of the purpos
 * @param {string=} options.documentUri // URI of the document -- TODO:: remove this and make inverse relation
 * @param {string=} options.contentType // content type of the content
 * @param {string=} options.shape // Shape of the content
 * @param {Object=} options.sign // Signature of the content
 * @param {string=} options.sign.signature // Signature value
 * @param {string=} options.sign.issuer // Issuer of the signature
 * 
 * @returns 
 */
exports.packageContent = function packageContent(content, options) { 
    let lines = content.split('\n')
    return processContent(lines, options)
}

/**
 * 
 * @param {*} lines 
 * @param {*} options 
 * @param {string=} options.packagedBy // Actor responsible for the packaging
 * @param {string=} options.packagedFrom // Origin of the packaged data
 * @param {string=} options.duration // Duration for which the receiving actor can use the data, takes a XSD duration
 * @param {string=} options.purpose // Purpose of the packaging - Usage Policy, takes a URL input of the purpos
 * @param {string=} options.documentUri // URI of the document -- TODO:: remove this and make inverse relation
 * @param {string=} options.contentType // content type of the content
 * @param {string=} options.shape // Shape of the content
 * @param {Object=} options.sign // Signature of the content
 * @param {string=} options.sign.signature // Signature value
 * @param {string=} options.sign.issuer // Issuer of the signature
 */
function processContent(lines, options) {
    parsingPrefixes = true;
    prefixString = '';
    contentsString = '';

    for (let line of lines) { 
        if (line.trim() !== "" && !line.trim().startsWith("@prefix")) {
            parsingPrefixes = false;
        } 
        
        if (parsingPrefixes) prefixString += line + `\n`
        else contentsString += tripleSpacing + line + `\n`
    }
    
    prefixString += `\n${headers}\n`
    let prefixes = prefixString.split('\n').map(x => x.trim())
    prefixes = prefixes.filter((v, i, a) => { return a.indexOf(v) === i })


    let blankNodes = Array.from(contentsString.matchAll(/_:[^\s;.]+/g)).map(x => x[0].trim())
    blankNodes = blankNodes.filter((v, i, a) => { return a.indexOf(v) === i })
    
    let result =
`${prefixes.sort().join('\n').trim()}
[] pack:packages {
${singleSpacing}[] pack:content {
${contentsString.trimEnd()}
${doubleSpacing}};
`
    result +=
        [].concat(
            addProvenance(options, doubleSpacing)
        ).concat(
            addSignature(options, doubleSpacing)
        ).concat(
            addPolicy(options, doubleSpacing)
        ).concat(
            addContentDescription(options, doubleSpacing)
        ).join(`;\n`) + ".\n"   
    result += `}.\n`
    return(result)
}

function addProvenance(options, spacing) {
    let metadata = []
    if(options.packagedBy) metadata.push(`${spacing}pack:packagedBy <${options.packagedBy}>`)
    if(options.packagedFrom) metadata.push(`${spacing}pack:packagedFrom <${options.packagedFrom}>`)
    metadata.push(`${spacing}pack:packagedAt "${new Date().toISOString()}"^^xsd:dateTime`)
    return metadata;
}


function addPolicy(options, spacing) { 
    let metadata = []

    if (!options.duration && !options.purpose) return metadata;

    let constraints = []

    if (options.duration) {
        constraints.push(
`${spacing}${doubleSpacing}odrl:constraint [
${spacing}${tripleSpacing}odrl:leftOperand odrl:elapsedTime ;
${spacing}${tripleSpacing}odrl:operator odrl:eq ;
${spacing}${tripleSpacing}odrl:rightOperand "${options.duration}"^^<http://www.w3.org/2001/XMLSchema#duration> ;
${spacing}${doubleSpacing}]`)
    }
        
    if (options.purpose) {
        constraints.push(
`${spacing}${doubleSpacing}odrl:constraint [
${spacing}${tripleSpacing}odrl:leftOperand <https://w3id.org/oac#Purpose> ;
${spacing}${tripleSpacing}odrl:operator odrl:eq ;
${spacing}${tripleSpacing}odrl:rightOperand <${options.purpose}> ;
${spacing}${doubleSpacing}]`)
    }

    let policyBody =
`${spacing}policy:hasContentPolicy [
${spacing}${singleSpacing}dcterms:creator <${options.packagedBy}> ;
${spacing}${singleSpacing}dcterms:description "Data Usage Policy" ;
${spacing}${singleSpacing}dcterms:issued "${new Date().toISOString()}"^^xsd:dateTime ;
${spacing}${singleSpacing}odrl:permission [
${spacing}${doubleSpacing}odrl:action odrl:use ;
${constraints.join(';\n')};\n
${spacing}${singleSpacing}];
${spacing}]`    
    
    return [policyBody];
}

function addContentDescription(options, spacing) { 
    let metadata = []
    if (options.contentType) metadata.push(`${spacing}pack:onContentSurfaceType "${options.contentType}"`)
    if (options.shape) metadata += (`${spacing}pack:shape <${options.shape}>`)
    return metadata;
}

function addSignature(options, spacing) {

    if (options.sign) {
        let signBody = 
`${spacing}sign:hasContentSignature [
${spacing}${singleSpacing}a sign:Signature;
${spacing}${singleSpacing}sign:issuer <${options.sign.issuer}>;
${spacing}${singleSpacing}sign:created "${new Date().toISOString()}"^^xsd:dateTime;
${spacing}${singleSpacing}sign:proofValue: "${options.sign.signature}";
${spacing}]`
        return [signBody]
    }
    else { return [] }
    
}