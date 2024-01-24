import { DataFactory, Quad, Store, Term } from "n3";
import { Component } from "../Component";
import { write } from '@jeswr/pretty-turtle';
import { ServiceInfo } from "../..";

const packagePredicate = "https://example.org/ns/package#packages"
const contentPredicate = "https://example.org/ns/package#content"

/**
 * This component handles the storage and retrieval of packaged data.
 */
export class PackageStorageComponent extends Component {

    private store: Store;

    constructor(info: ServiceInfo) {
        super(info);
        
        this.store = new Store();
    }

    async start() {}

    async close() {}

    /**
     * Add package quads to the quadstore.
     * note: This function removes all quads in the default graph that are not a package!
     */
    protected async addPackage(quads: Quad[]) {
        // TODO:: why did I do this???
        let filteredQuads = quads.filter(q => !q.graph.equals(DataFactory.defaultGraph()) || q.predicate.value === packagePredicate)
        this.store.addQuads(filteredQuads);
    }

    /**
    * Extracting Packages From Match Algorithm
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

    /**
     * Get all packages containing a match for the requested triple as a list of quads
     */
    protected async getPackagesWithMatch(match: Quad) : Promise<Quad[]> {
        let dataGraphs = await this.getSeparatePackagesWithMatch(match)
        let combinedDataGraphs: Quad[] = []
        for (let graph of dataGraphs) {
            combinedDataGraphs = combinedDataGraphs.concat(graph)
        } 
        return combinedDataGraphs;
    }

    /**
     * Get all packages containing a match for the requested triple as separate lists of quads
     */
    protected async getSeparatePackagesWithMatch(match: Quad) : Promise<Quad[][]> {

        let rootPackages: Quad[] = []

        // 1. Find the graph value of the quad
        let subject = match.subject.termType === "Variable" ? null : match.subject ;
        let predicate = match.predicate.termType === "Variable" ? null : match.predicate ;
        let object = match.object.termType === "Variable" ? null : match.object ;
        
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
        
        let dataGraphs: Quad[][] = []
        
        // 6. We do this through a flood fill, of taking a list of ALL package graphs
        let i = 0;
        for (let rootPackage of rootPackages) {
            let dataGraph : Quad[] = []
            dataGraph = dataGraph.concat(rootPackage)
            dataGraph = dataGraph.concat(
                this.extractSubgraphFromStore(this.store, rootPackage.object)
            )
            dataGraphs[i] = dataGraph
            i++
        }
        return dataGraphs
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
