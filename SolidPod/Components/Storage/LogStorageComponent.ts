import { DataFactory, Quad } from "n3";
import { PackageStorageComponent } from "./PackageStorageComponent";
import { packageContentQuadsToN3Quads } from "../../../packaging/package";
import { unpackagePackageN3Quads } from "../../../packaging/unpackage";

export class LogStorageComponent extends PackageStorageComponent {
    
    // TODO:: policy ontology. Move this to a separate place where it's easy to change
    async getLogs() : Promise<Quad[][]> {
        const separatedLogs: Quad[][] = []
        let logPackages = await this.getLogPackages();
        let separatedPolicies: Quad[][] = []
        for (let logPackage of logPackages) {
            separatedLogs.push(unpackagePackageN3Quads(logPackage));
        }
        return separatedPolicies
    }

    async getLogPackages() : Promise<Quad[][]> {
        return this.getSeparatePackagesWithMatch(
            DataFactory.quad(
                DataFactory.variable("s"), 
                DataFactory.namedNode('<urn:localStorage:hasType>'),
                DataFactory.namedNode('<urn:localStorage:logEntry>'),
            )
        )
    }
    
    async addLogEntry(quads: Quad[]) {
        let packagedContent = await packageContentQuadsToN3Quads(quads, {
            actor: "urn:podStorage:logStorageComponent",
            quads: [
                DataFactory.quad(
                    DataFactory.blankNode('package'),
                    DataFactory.namedNode('<urn:localStorage:hasType>'),
                    DataFactory.namedNode('<urn:localStorage:logEntry>'),
                    undefined
                )
            ]
        })
        return this.addPackage(packagedContent);
    }
}
