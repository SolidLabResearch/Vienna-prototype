import { AdminInterface } from './Interfaces/AdminInterface/api'
import { AuthZInterface } from './Interfaces/AuthZInterface/api'

const adminInterfacePort = 8060
const authZInterfacePort = 8050

const adminInterface = new AdminInterface()
const authZInterface = new AuthZInterface()
adminInterface.start(adminInterfacePort)
authZInterface.start(authZInterfacePort)