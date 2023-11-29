import { AdminInterface } from './Interfaces/AdminInterface/api'
import { AuthZInterface } from './Interfaces/AuthZInterface/api'
import { runInterface } from './Interfaces/DataInterface/api'

export function startPod() {

    const adminInterfacePort = 8060
    const authZInterfacePort = 8050
    const dataInterfacePort = 8040
    
    const adminInterface = new AdminInterface()
    const authZInterface = new AuthZInterface()
    adminInterface.start(adminInterfacePort)
    authZInterface.start(authZInterfacePort)
    
    // start Data Interface 
    const server = runInterface(dataInterfacePort);

    return [
        adminInterface,
        authZInterface,
        { stop: () => new Promise(res => server.then(s => s.close(res))) }
    ]
}
