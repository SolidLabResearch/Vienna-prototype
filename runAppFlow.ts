import { SolidLib } from './SolidLib/Interface/SolidLib'
import { startPod } from './SolidPod/index'
import { run as runCompanyAPI } from './ExternalServices/companyAPI'
import { run as runFlandersAPI } from './ExternalServices/flandersAPI'

async function setup() {
    console.log('')
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

async function getDataFlow() {
    
    const solidLib = new SolidLib("food-store");
    await solidLib.login()
    let dataplusplus = await solidLib.getData("?webID <https://www.w3.org/2006/vcard/ns#bday> ?bdate .", [
        "verification",
        "advertisement"
    ])
    let dataplusplustrusted = await solidLib.getDataWithTrust("?webID <https://www.w3.org/2006/vcard/ns#bday> ?bdate .", [
        "verification",
        "advertisement"
    ])

    console.log('App flow response')
    console.log(dataplusplus)
    console.log('The trusted data is')
    console.log(dataplusplustrusted)
    await solidLib.logout()
}

async function run() {
    const close = await setup()

    console.log('')
    console.log('######################################')
    console.log('Running Experiment')
    console.log('######################################')
    console.log('')
    await getDataFlow()
    await close();
}


run()