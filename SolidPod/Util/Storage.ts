import { existsSync, mkdirSync, readFileSync, readdirSync, rmdirSync, statSync, unlinkSync, writeFileSync } from 'fs';
import { Store, Writer } from 'n3';
import { fileAsStore } from './Util';
import path from 'path';

// TODO: does storage for log, data and polices. Currently only with a filesystem
export abstract class FileStore {
    protected path: string

    constructor(path: string) {
        this.path = path;
        this.init()
    }
    public init(): void {
        if (!existsSync(this.path)) {
            mkdirSync(this.path, { recursive: true });
        }
    }
    public async read(fileName: string): Promise<Store> {
        const filePath = path.join(this.path, fileName)
        return await fileAsStore(filePath)
    }
    public write(policy: string, fileName?: string): void {
        const filePath = this.getPath(fileName ?? "temp.ttl")
        writeFileSync(filePath, policy)
    }

    public delete(fileName: string): void {
        const filePath = this.getPath(fileName ?? "temp.ttl")
        unlinkSync(filePath)
    }
    public async readAll(): Promise<Store> {
        const store = new Store()

        const fileList = readdirSync(this.path)
        for (const file of fileList) {
            const filePath = this.getPath(file)
            if (statSync(filePath).isFile()) {
                store.addQuads((await fileAsStore(filePath)).getQuads(null, null, null, null))
            }

        }
        return store
    }

    public readAllJSON() {
        let jsonResults: any[] = []
        const fileList = readdirSync(this.path)
        for (const file of fileList) {
            const filePath = this.getPath(file)
            if (statSync(filePath).isFile()) {
                let fileText: string = readFileSync(filePath, { encoding: "utf-8" })
                let fileObj: any = JSON.parse(fileText)
                jsonResults.push(fileObj)
            }

        }
        return jsonResults
    }

    // removes everything in the directory
    public clear(): void {
        rmdirSync(this.path, { recursive: true })
        this.init()
    }
    protected getPath(fileName: string): string {
        return path.join(this.path, fileName)
    }
}

export class PolicyStore extends FileStore {
    constructor() {
        super(path.join(process.cwd(), 'data', 'policies')) // Don't use this in production
        console.log("Path where policies are stored:", path.join(process.cwd(), 'data', 'policies'));
    }
}


export class LogStore extends FileStore {
    constructor() {
        super(path.join(process.cwd(), 'data', 'logs')) // Don't use this in production
        console.log("Path where agreements are stored:", path.join(process.cwd(), 'data', 'logs'));
    }
}