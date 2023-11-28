const { encapsulateData } = require('../encapsulate-data')
const fs = require('fs')
const { n3reasoner } = require('eyereasoner');

/**
 * @param {string} path // Path of file to filter packages from
 * @param {Object} options 
 * @param {string} options.packagedBy // Filter on actor that did the packaging
 * @param {string} options.packagedFrom // Filter on data origin
 * @param {string} options.purpose // Fitler on purpose of use
 * @returns 
 */
exports.flattenPackagesFromFile = async function flattenPackagesFromFile(path) {
    let content = fs.readFileSync(path, {encoding: "utf-8"})
    return processContent(content)
}


/**
 * 
 * @param {string} content // content to move on the given surface
 * @returns 
 */
exports.flattenPackagesFromContent = async function filterPackagesFromContent(content) {
    return processContent(content)
}


async function processContent(content) { 
    return await runFilter(content, flattenRule, "")
}

let flattenRule = `
@prefix log: <http://www.w3.org/2000/10/swap/log#>.
@prefix list: <http://www.w3.org/2000/10/swap/list#>.
@prefix graph: <http://www.w3.org/2000/10/swap/graph#>.
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>.
@prefix pack: <https://example.org/ns/package#>.
@prefix : <http://example.org/ns#>.

{
    ?l :data ?g.
    ?g :flatten ?h.
} => ?h.

# the logic for flatten in 4 backward rules
{
    {
        ?b :package ?p.
    } :flatten ?d.
} <= {
    ?p log:includes {
        << ?a :content ?c >> ?q ?t.
    }.
    ?c graph:list ?l.
    ?l :flatten ?m.
    ?m graph:union ?d.
}.

{
    () :flatten ().
} <= true.

{
    ?g :flatten ?h.
} <= {
    ?g list:firstRest (?f ?r).
    ?h list:firstRest (?a ?b).
    ?f :flatten ?a.
    ?r :flatten ?b.
}.

{
    ?g :flatten ?g.
} <= {
    ?g log:rawType ?r.
    ?r log:notEqualTo rdf:List.
    ?g log:notIncludes {
        ?a :package ?p.
    }.
}.
`

async function runFilter(content, filter) { 

    // Move the data to a data graph to separate rules from data
    let encapsulatedContent = encapsulateData(content)
    let combinedContentAndFilter = encapsulatedContent + "\n" + filter;
    // Run the filter in the reasoner
    const resultString = await n3reasoner(combinedContentAndFilter);
    return resultString
}