import { AdminInterface } from './Interfaces/AdminInterface/api'
import { AuthZInterface } from './Interfaces/AuthZInterface/api'
import { LogInterface } from './Interfaces/LogInterface/api'
import { DataInterface } from './Interfaces/DataInterface/api'
import { IdentityInterface } from './Interfaces/IdentityInterface/api'

import { DataStorageComponent } from './Components/Storage/DataStorageComponent'
import { serializeCryptoKey } from './Util/Util'
import { Component } from './Components/Component'
import { PublicInterface } from './Interfaces/PublicInterface'

import crypto from "crypto"
import { PolicyStorageComponent } from './Components/Storage/PolicyStorageComponent'



let adminInterfacePort = 8060
let authZInterfacePort = 8050
let dataInterfacePort = 8040
let logInterfacePort = 8030
let identityInterfacePort = 8020

export type SolidServerOptions = {
    podId: string, 
    IDPServerId: string,
    disableAuthorization?: boolean,
    webId?: string,
    adminInterfacePort?: number,
    authZInterfacePort?: number,
    dataInterfacePort?: number,
    logInterfacePort?: number,
    identityInterfacePort?: number,
}

export type IdentityServiceInfo = {
    podId: string,
    keyPair: CryptoKeyPair
}

export type ServiceInfo = {
    webId: string,
    podId: string,
    keyPair: CryptoKeyPair,
    IDPServerId: string,
}

export type EndpointInfo = {
    dataEndpoint: string,
    authZEndpoint: string,
    adminEndpoint: string,
    logEndpoint: string,
    identityEndpoint: string,
}

export class SolidPod {

    components: Map<string, Component>;
    interfaces: Map<string, PublicInterface | undefined>;
    webId?: string;
    keyPair?: CryptoKeyPair;


    constructor() {
        this.components = new Map();
        this.interfaces = new Map();
    }

    async initialize(serverOptions: SolidServerOptions) {
        let podId = serverOptions.podId;

        adminInterfacePort = serverOptions.adminInterfacePort || adminInterfacePort
        authZInterfacePort = serverOptions.authZInterfacePort || authZInterfacePort
        dataInterfacePort = serverOptions.dataInterfacePort || dataInterfacePort
        logInterfacePort = serverOptions.logInterfacePort || logInterfacePort
        identityInterfacePort = serverOptions.identityInterfacePort || identityInterfacePort
        
        // Setting up necessary stuff for the Pod server
        let keyPair = await crypto.subtle.generateKey(
            {
                name: "ECDSA",
                namedCurve: "P-384",
            },
            true,
            ["sign", "verify"]
        );

        const IDPServerId = serverOptions.IDPServerId;
        
        let serviceInfo : ServiceInfo = {
            podId, keyPair, webId: "", IDPServerId
        }

        let endpoints: EndpointInfo = {
            dataEndpoint: `http://localhost:${dataInterfacePort}/${podId}/endpoint`,
            authZEndpoint: `http://localhost:${authZInterfacePort}/`,
            adminEndpoint: `http://localhost:${adminInterfacePort}/`,
            logEndpoint: `http://localhost:${logInterfacePort}/`,
            identityEndpoint: `http://localhost:${identityInterfacePort}/`,
        }

        let identityInterface;
        let webId : string;
        // if (!serverOptions.webId) {
            identityInterface = new IdentityInterface(serviceInfo, endpoints)
            await identityInterface.start(identityInterfacePort)
            let maybeWebID = identityInterface.getWebId()
            if (!maybeWebID) throw new Error('WebID could not be created.')
            webId = maybeWebID
            // Now we need to manually add the key to our WebID 
            const keyString = await serializeCryptoKey(keyPair.publicKey)
        // } else {
        //     webId = serverOptions.webId;
        // }

        // Components
        const dataStorageComponent = new DataStorageComponent(serviceInfo);
        const policyStorageComponent = new PolicyStorageComponent(serviceInfo);

        // Interfaces
        const adminInterface = new AdminInterface(serviceInfo, policyStorageComponent)
        const authZInterface = new AuthZInterface(serviceInfo)
        const logInterface = new LogInterface(serviceInfo)
        const dataInterface = new DataInterface(serviceInfo, dataStorageComponent);

        await adminInterface.start(adminInterfacePort)
        await authZInterface.start(authZInterfacePort)
        await logInterface.start(logInterfacePort)
        await dataInterface.start(dataInterfacePort)

        this.components.set("dataStorageComponent", dataStorageComponent)
        this.interfaces.set("adminInterface", adminInterface)
        this.interfaces.set("authZInterface", authZInterface)
        this.interfaces.set("logInterface", logInterface)
        this.interfaces.set("dataInterface", dataInterface)
        this.interfaces.set("identityInterface", identityInterface)

        this.webId = webId;
        this.keyPair = keyPair;
    }

    async close() {
        await Promise.all((Array.from(this.interfaces.values())).map( i => i && i.stop()))
    }
}
