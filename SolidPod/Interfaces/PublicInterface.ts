import { Server } from "http"
import { ServiceInfo } from "..";

export abstract class PublicInterface {
    protected server: Server | undefined;
    protected info: ServiceInfo;

    constructor(info: ServiceInfo) {
        this.info = info;
    }

    abstract start(port: number): Promise<void>;
    abstract stop(): Promise<void>;
}