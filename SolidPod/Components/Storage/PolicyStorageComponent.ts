import { DataFactory, Quad } from "n3";
import { PackageStorageComponent } from "./PackageStorageComponent";
import { packageContentQuads, packageContentQuadsToN3Quads } from "../../../packaging/package";
import { unpackagePackageN3Quads } from "../../../packaging/unpackage";

export class PolicyStorageComponent extends PackageStorageComponent {
    
    // TODO:: policy ontology. Move this to a separate place where it's easy to change
    async getPolicies() : Promise<Quad[][]> {
        let policyPackages = await this.getPolicyPackages();
        let separatedPolicies: Quad[][] = []
        for (let policyPackage of policyPackages) {
            separatedPolicies.push(unpackagePackageN3Quads(policyPackage));
        }
        return separatedPolicies
    }

    async getPolicyPackages() : Promise<Quad[][]> {
        return this.getSeparatePackagesWithMatch(
            DataFactory.quad(
                DataFactory.variable("s"), 
                DataFactory.namedNode("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"), 
                DataFactory.namedNode("http://example.org/ns/policy/Policy") 
            )
        )
    }

    async addPolicy(quads: Quad[], actor: string) : Promise<void> {
        let policyPackageN3Quads = await packageContentQuadsToN3Quads(quads, {
            actor: actor
        })
        this.addPackage(policyPackageN3Quads);
        
    }
}
