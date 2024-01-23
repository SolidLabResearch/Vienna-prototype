import { run as runCompanyAPI } from './ExternalServices/companyAPI'
import { run as runFlandersAPI } from './ExternalServices/flandersAPI'
import { linkAccountWithWebID } from './IDP'
import { IDPServer } from './IDP/setup'
import { LogStore, PolicyStore } from './SolidPod/Util/Storage'
import { SolidPod, SolidServerOptions } from './SolidPod/index'

const IDPServerPort = 7834
const IDPServerId = `http://localhost:${IDPServerPort}`

export function clearStores() {
  console.log('')
  console.log('######################################')
  console.log('Clear log of agreements and policies in pod')
  console.log('######################################')
  console.log('')
  console.log('')
  new PolicyStore().clear()
  new LogStore().clear()
}

export async function setup(podId: string) {
  console.log('######################################')
  console.log('Setting Up External APIs to fetch data')
  console.log('######################################')
  console.log('')
  const company = await runCompanyAPI()
  const flanders = await runFlandersAPI()

  console.log('')
  console.log('######################################')
  console.log('Setting up Identity Provider')
  console.log('######################################')
  console.log('')
  const idpServer = new IDPServer();
  idpServer.start(IDPServerPort)

  console.log('')
  console.log('######################################')
  console.log('Setting up Pod Interfaces')
  console.log('######################################')
  console.log('')
  const pod = new SolidPod();
  await pod.initialize({podId, IDPServerId})

  return async () => {
    await new Promise(res => company.close(res));
    await new Promise(res => flanders.close(res));podId
    await Promise.all(Array.from(pod.interfaces.values()).map(p => p&&p.stop()));
    await idpServer.stop();
  }
}


export async function setupOnlyAPIs() {
  console.log('######################################')
  console.log('Setting Up External APIs to fetch data')
  console.log('######################################')
  console.log('')
  const company = await runCompanyAPI()
  const flanders = await runFlandersAPI()
  return async () => {
    await new Promise(res => company.close(res));
    await new Promise(res => flanders.close(res));
  }
}

export async function setupIDP(port?: number) {
  port = port || IDPServerPort
  const server = new IDPServer();
  await server.start(port);
  return server;
}

export async function createPodAndIDPLink(userOptions: { webId: string, password: string, email: string}, podOptions: SolidServerOptions) {

  console.log('######################################')
  console.log('Setup IDP Account and Link')
  console.log('######################################')
  console.log('')
    // create account for steve at IDP
  await linkAccountWithWebID(podOptions.IDPServerId, userOptions)

  console.log('######################################')
  console.log('Setting up Pod Interfaces')
  console.log('######################################')
  console.log('')
  const pod = new SolidPod();
  await pod.initialize(podOptions)

  return pod;
}
