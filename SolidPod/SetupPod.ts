import { AdminInterface } from './Interfaces/AdminInterface/api'
import { AuthZInterface } from './Interfaces/AuthZInterface/api'
import { runInterface } from './Interfaces/DataInterface/api'

const adminInterfacePort = 8060
const authZInterfacePort = 8050
const dataInterfacePort = 8040

const adminInterface = new AdminInterface()
const authZInterface = new AuthZInterface()
adminInterface.start(adminInterfacePort)
authZInterface.start(authZInterfacePort)

runInterface();