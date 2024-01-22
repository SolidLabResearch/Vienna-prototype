import { Quad } from "n3";
import { DataStorageComponent } from "./SolidPod/Components/Storage/DataStorageComponent";
import { setup, setupOnlyAPIs, setupOnlyPod } from "./setup";
import { n3toQuadArray } from "./packaging/createSignedPackage";
import { SolidLib } from "./SolidLib/Interface/SolidLib";
import { readFileSync } from "fs"

import { subtle, webcrypto } from 'crypto';
import { createKeyPairFiles } from "./createKeys";

async function run() {
    // Setup other APIs
    const closeOtherAPIs = await setupOnlyAPIs()

    let userKeyPair = createKeyPairFiles('./test/userinfo/keys/steve-public.pem', './test/userinfo/keys/steve-private.pem')
    let storeKeyPair = createKeyPairFiles('./test/userinfo/keys/store-public.pem', './test/userinfo/keys/store-private.pem')

    // Create user Pod. 
    const stevePod = await setupOnlyPod({
        podId: "steve",
        adminInterfacePort: 8060,
        authZInterfacePort: 8050,
        dataInterfacePort: 8040,
        logInterfacePort: 8030,
        identityInterfacePort: 8020,
    })

    // preload pod with basic info
    let steveDataComponent = stevePod.components.get('dataStorageComponent');

    if (steveDataComponent && stevePod.webId) {
        await (steveDataComponent as DataStorageComponent).addData(await prefetchUserDemoData(stevePod.webId))
    }

    // Add policy that birthDate can be retrieved by stores
    if (!stevePod.webId) throw new Error('WebID was not created')

    const solidLib = new SolidLib("admin-App", stevePod.webId); // TODO:: discover steve endpoint from WebID
    const loginInfo = JSON.parse(readFileSync("./test/userinfo/steve.json", {encoding: "utf-8"}))
    await solidLib.login(loginInfo.webId, loginInfo.email, loginInfo.password) // Get endpoint through WebID
    await solidLib.addPolicy(`
<myPolicy> <a> <Policy>;
    <subject> <food-store>;
    <action> <read>;
    <resource> <date_of_birth>;
    <context> <verification>.`)

    await solidLib.logout();

    // Create Store Pod
    const storePod = await setupOnlyPod({
        podId: "store",
        adminInterfacePort: 7060,
        authZInterfacePort: 7050,
        dataInterfacePort: 7040,
        logInterfacePort: 7030,
        identityInterfacePort: 7020,
    })

    let storeDataComponent = storePod.components.get('dataStorageComponent');

    // preload pod with drink catalog
    if (storeDataComponent && storePod.webId) {
        await (storeDataComponent as DataStorageComponent).addData(await prefetchStoreDemoData(storePod.webId))
    }

    // Add policy that birthDate is required for alcoholic beverages
    










    // Wait for keypress to close

    const keypress = async () => {
        process.stdin.setRawMode(true)
        return new Promise<void>(resolve => process.stdin.once('data', () => {
        process.stdin.setRawMode(false)
        resolve()
        }))
    }
    
    ;(async () => {
        await keypress()
    })().then(async() => {
        console.log('Endpoints closed by keypress')
        // stevePod.close();
        // storePod.close();
        closeOtherAPIs()
        process.exit()
    })

}




export async function prefetchUserDemoData(webId: string) {
    let quads: Quad[] = [];
    // TODO:: authenticated requests??
    quads = quads.concat(await n3toQuadArray( await (await fetch(`http://localhost:3456/flandersgov/endpoint/dob?id=${webId}`)).text() ) )
    quads = quads.concat(await n3toQuadArray( await (await fetch(`http://localhost:3456/flandersgov/endpoint/name?id=${webId}`)).text() ) )
    quads = quads.concat(await n3toQuadArray( await (await fetch(`http://localhost:3456/flandersgov/endpoint/address?id=${webId}`)).text() ) )
    quads = quads.concat(await n3toQuadArray( await (await fetch(`http://localhost:3457/company/endpoint/licensekey?id=${webId}`)).text() ) )
    quads = quads.concat(await n3toQuadArray( await (await fetch(`http://localhost:3457/company/endpoint/dob?id=${webId}`)).text() ) )

    return quads
} 




export async function prefetchStoreDemoData(webId: string) {
    let quads: Quad[] = [];
    // TODO:: authenticated requests??
    quads = quads.concat(await n3toQuadArray( await (await fetch(`https://pod.rubendedecker.be/demos/store/drinks.n3`)).text() ) )
    
    return quads
} 


run()