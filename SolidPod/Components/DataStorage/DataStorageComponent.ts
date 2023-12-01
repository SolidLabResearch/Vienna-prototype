import { DataFactory, Quad, Store, Term } from "n3";
import { Component } from "../Component";
import { write } from '@jeswr/pretty-turtle';
import { ServiceInfo } from "../..";

const packagePredicate = "https://example.org/ns/package#packages"
const contentPredicate = "https://example.org/ns/package#content"

export class DataStorageComponent extends Component {

    store: Store;

    constructor(info: ServiceInfo) {
        super(info);
        
        this.store = new Store();
    }

    async start() {}

    async close() {}

        
    async backdoorAddData(quads: Quad[]) {
        await this.store.addQuads(quads);
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
    public async getData(matchTriple: Quad) : Promise<Quad[]> {

        let rootPackages: Quad[] = []

        // 1. Find the graph value of the quad
        let subject = matchTriple.subject.termType === "Variable" ? null : matchTriple.subject ;
        let predicate = matchTriple.predicate.termType === "Variable" ? null : matchTriple.predicate ;
        let object = matchTriple.object.termType === "Variable" ? null : matchTriple.object ;
        
        let matches = this.store.getQuads(subject, predicate, object, null);
        if (!matches || matches.length === 0) return []
        
        while (matches.length) {
            let newMatches: Quad[] = []
            for (let match of matches) {
                // 5. When we come to the root package (the graph value is the default graph), we need to retrieve the whole package structure.
                if ( match.graph.equals(DataFactory.defaultGraph()) ) {
                    rootPackages.push(match);
                    continue;
                }
        
                // 2. Check if the graph value is the object of a << [] pack:content _:graph _:packageGraph >> quad.
                let contentTriples = this.store.getQuads(null, contentPredicate, match.graph, null)
                let contentTriple = contentTriples && contentTriples.length ? contentTriples[0] : undefined
                if (!contentTriple) continue;
        
                // 3. Get the root by getting the << [] pack:package _:packageGraph _:outerGraph >> quad.
                let packageShellTriples = this.store.getQuads(null, packagePredicate, contentTriple.graph, null)
                let packageShellTriple = packageShellTriples && packageShellTriples.length ? packageShellTriples[0] : undefined
                if (!packageShellTriple) continue;
        
                newMatches.push(packageShellTriple)
            }    
            // 4. If the _:outerGraph quad is not the default graph, repeat the process.
            matches = newMatches;
        }
        
        let dataGraph : Quad[] = []
        
        // 6. We do this through a flood fill, of taking a list of ALL package graphs
        for (let rootPackage of rootPackages) {
            dataGraph = dataGraph.concat(rootPackage)
            dataGraph = dataGraph.concat(
                this.extractSubgraphFromStore(this.store, rootPackage.object)
            )
        }   
        
        return dataGraph
        
    }

    private async serializeN3Quads(quads: Quad[]) {

        if (!quads || quads.length === 0) {
            throw new Error('No matches found for your request')
        }

        // 8. Serialize the package structure using Jesse's magic lib
        let packageString = await write(quads, {format: "text/n3", prefixes: {
            "pack": "https://example.org/ns/package#",
            "policy": "https://example.org/ns/policy#",
            "sign": "https://example.org/ns/signature#",
        }});

        // Remove empty lines
        packageString = packageString.replace(/(^[ \t]*\n)/gm, "")
        return packageString;
        
    }    

    private extractSubgraphFromStore(store: Store, graph: Term): Quad[] {
        let subgraphQuads: Quad[] = []
        // 7a. Emit all quads that are part of the package graph.
        let graphQuads = store.getQuads(null, null, null, graph);
        if (!graphQuads || graphQuads.length === 0) return []
    
        subgraphQuads = subgraphQuads.concat(graphQuads);
    
        for (let quad of graphQuads) {
            subgraphQuads = subgraphQuads.concat(
                this.extractSubgraphFromStore(store, quad.object)
            )
        }
    
        return subgraphQuads;
    }
    
}








