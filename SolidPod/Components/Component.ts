export abstract class Component {
    
    abstract start(): Promise<void>;

    abstract close(): Promise<void>;
}