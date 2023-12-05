import { Quad } from "n3";
import { PackageStorageComponent } from "./PackageStorageComponent";

export class DataStorageComponent extends PackageStorageComponent {

    public async addData(quads: Quad[]) {
        this.addPackage(quads)
    }

    public async getData(matchTriple: Quad) : Promise<Quad[]> {
        return this.getPackagesWithMatch(matchTriple);        
    }

}








