import { ServiceInfo } from "..";

export abstract class Component {

    constructor(protected info: ServiceInfo) {}
    
    public abstract start(): Promise<void>;

    public abstract close(): Promise<void>;
}