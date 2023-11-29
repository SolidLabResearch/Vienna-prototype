const express = require('express')
const fs = require('fs')
const rdfParser = require("rdf-parse").default;
const rdfSerializer = require("rdf-serialize").default;
const stringifyStream = require('stream-to-string');
const { exec } = require('child_process');
const program = require('commander');  
const { packageContent } = require('../software/packaging/');


program
    .description('RDF+package server')
    .option('--port <string>', 'Server port')
    .option('--duration <string>', 'Add duration requirement to policy')
    .option('--purpose <string>', 'Add required purpose to policy')
    .option('--document-location <string>', 'Location of server documents')
    .action((options) => { 
        const app = express()
        const port = options.port || 3000

        options.baseurl = `http://localhost:${port}/`
        options.webid = `http://localhost:${port}/#service`

        app.get('/', (req, res) => { route(req, res, options) })
        app.get('/*', (req, res) => { route(req, res, options) })

        app.listen(port, () => {
            console.log(`Server listening on port ${port}`)
        })
    })
        
program.parse(process.argv)


async function route(req, res, options) {
    let documentLocation = options.documentLocation || "documents/"
    documentLocation = documentLocation.endsWith("/") ? documentLocation : documentLocation + "/"

    let headers = req.headers;

    let contentType = (headers && headers.accept) || "text/turtle"
    if (contentType === "*/*") contentType = "text/turtle"
    
    let documentName = req.url.slice(1);
    
    let response = ""

    if (contentType === "text/rdf+package") {
        try {
            options.documentUri = `${options.baseurl}${documentName}`
            options.packagedBy = options.webid
            let data = fs.readFileSync(`./documents/${documentName}`, {encoding: 'utf-8'});
            response = await packageContent(data, options)
            
            
        } catch (e) { 
            console.error(e)
        }

    } else { 
        response = await new Promise(async (resolve, reject) => { 
            try {
                // Put document on data surface
                await new Promise((resolve, reject) => { 
                    let command = exec(`node ../software/move-to-surface/bin/move-to-surface.js -s onDataSurface ${documentLocation}${documentName} > ./intermediate/onsurface.n3`)
                    command
                        .on('error', (e) => reject(e))
                        .on('exit', () => resolve())
                }) 

                // Flatten document
                await new Promise((resolve, reject) => { 
                    let command = exec(`eye --quiet --nope --no-qnames ./intermediate/onsurface.n3 ../logic/flatten/* > intermediate/flattened.n3`)
                    command
                        .on('error', (e) => reject(e))
                        .on('exit', () => resolve())
                }) 

                // Return flattened RDF document
                let documentContent = fs.readFileSync(`./intermediate/flattened.n3`, { encoding: "utf-8" })
                let contentStream = require("streamify-string")(documentContent)
                let quadStream = rdfParser.parse(contentStream, { contentType: 'text/turtle', baseIRI: options.baseurl || 'http://example.org' }).on('error', (error) => { reject(error) });
                let textStream;
                if ((await rdfSerializer.getContentTypes()).indexOf(contentType) === -1) { 
                    console.error(`Error: Unrecognized content type: ${contentType}. Fallback on text/turtle.`)
                    contentType = 'text/turtle'
                }
                textStream = rdfSerializer.serialize(quadStream, { contentType: contentType });   
                let result = await stringifyStream(textStream);
                resolve(result)
            } catch (e) {
                console.error(e)
                reject(e)
            } 
        })

    }
    
    res.send(response)
}
