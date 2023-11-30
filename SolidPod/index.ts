import { AdminInterface } from './Interfaces/AdminInterface/api'
import { AuthZInterface } from './Interfaces/AuthZInterface/api'
import { LogInterface } from './Interfaces/LogInterface/api'
import { DataInterface } from './Interfaces/DataInterface/api'
import { IdentityInterface } from './Interfaces/IdentityInterface/api'

import { generateKeyPair } from './Util/packaging/createSignedPackage'
import { ServerConfigurator } from '@solid/community-server'
import { DataStorageComponent } from './Components/DataStorage/DataStorageComponent'


const adminInterfacePort = 8060
const authZInterfacePort = 8050
const dataInterfacePort = 8040
const logInterfacePort = 8030
const identityInterfacePort = 8020

export type IdentityServiceInfo = {
    podId: string,
    keyPair: CryptoKeyPair
}

export type ServiceInfo = {
    webId: string,
    podId: string,
    keyPair: CryptoKeyPair
}


export async function startPod(podId: string) {
    
    // Setting up necessary stuff for the Pod server
    let keyPair = await crypto.subtle.generateKey(
        {
            name: "ECDSA",
            namedCurve: "P-384",
        },
        true,
        ["sign", "verify"]
    );

    let serviceInfo : ServiceInfo = {
        podId, keyPair, webId: ""
    }

    const identityInterface = new IdentityInterface(serviceInfo)
    await identityInterface.start(identityInterfacePort)
    let webId = identityInterface.getWebId()
    if (!webId) throw new Error('WebID could not be created.')

    serviceInfo.webId = webId;


    // Components
    const dataStorageComponent = new DataStorageComponent(serviceInfo);

    // Interfaces
    const adminInterface = new AdminInterface(serviceInfo)
    const authZInterface = new AuthZInterface(serviceInfo)
    const logInterface = new LogInterface(serviceInfo)
    const dataInterface = new DataInterface(serviceInfo, dataStorageComponent);

    await adminInterface.start(adminInterfacePort)
    await authZInterface.start(authZInterfacePort)
    await logInterface.start(logInterfacePort)
    await dataInterface.start(dataInterfacePort)

    return [
        adminInterface,
        authZInterface,
        logInterface,
        dataInterface,
    ]
}
