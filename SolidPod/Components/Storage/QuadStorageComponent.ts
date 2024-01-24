import { DataFactory, OTerm, Quad, Store, Term } from "n3";
import { Component } from "../Component";
import { write } from '@jeswr/pretty-turtle';
import { ServiceInfo } from "../..";

const packagePredicate = "https://example.org/ns/package#packages"
const contentPredicate = "https://example.org/ns/package#content"

/**
 * This component handles the storage and retrieval of packaged data.
 */
export class QuadStorageComponent extends Component {

    private store: Store;

    constructor(info: ServiceInfo) {
        super(info);
        
        this.store = new Store();
    }

    async start() {}

    async close() {}

    /**
     * Add package quads to the quadstore.
     */
    public async addQuads(quads: Quad[]) {
        this.store.addQuads(quads);
    }

    public async getQuads(subject: OTerm, predicate: OTerm, object: OTerm) {
        this.store.getQuads(subject, predicate, object, null)
    }

}
