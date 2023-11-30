import { AdminInterface } from './Interfaces/AdminInterface/api'
import { AuthZInterface } from './Interfaces/AuthZInterface/api'
import { LogInterface } from './Interfaces/LogInterface/api'
import { runInterface } from './Interfaces/DataInterface/api'
import { IdentityInterface } from './Interfaces/IdentityInterface/api'

import { generateKeyPair } from './Util/packaging/createSignedPackage'


const adminInterfacePort = 8060
const authZInterfacePort = 8050
const dataInterfacePort = 8040
const logInterfacePort = 8030
const identityInterfacePort = 8020


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



    const identityInterface = new IdentityInterface()
    const adminInterface = new AdminInterface()
    const authZInterface = new AuthZInterface()
    const logInterface = new LogInterface()

    await identityInterface.start(identityInterfacePort, podId, keyPair)
    let webId = identityInterface.getWebId()
    if (!webId) throw new Error('WebID could not be created.')

    await adminInterface.start(adminInterfacePort)
    await authZInterface.start(authZInterfacePort)
    await logInterface.start(logInterfacePort)
    
    // start Data Interface 
    const server = runInterface(dataInterfacePort, podId, webId, keyPair);

    return [
        adminInterface,
        authZInterface,
        { stop: () => new Promise(res => server.then(s => s.close(res))) }
    ]
}
