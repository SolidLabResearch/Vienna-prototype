import { run as runCompanyAPI } from './ExternalServices/companyAPI'
import { run as runFlandersAPI } from './ExternalServices/flandersAPI'
import { LogStore, PolicyStore } from './SolidPod/Util/Storage'
import { startPod } from './SolidPod/index'

export async function setup() {
  console.log('')
  console.log('######################################')
  console.log('Clear log of agreements and policies in pod')
  console.log('######################################')
  console.log('')
  console.log('')
  new PolicyStore().clear()
  new LogStore().clear()
  console.log('######################################')
  console.log('Setting Up External APIs to fetch data')
  console.log('######################################')
  console.log('')
  const company = await runCompanyAPI()
  const flanders = await runFlandersAPI()
  console.log('')
  console.log('######################################')
  console.log('Setting up Pod Interfaces')
  console.log('######################################')
  console.log('')
  const pod = startPod()

  return async () => {
      await new Promise(res => company.close(res));
      await new Promise(res => flanders.close(res));
      await Promise.all(pod.map(p => p.stop()));
  }
}
