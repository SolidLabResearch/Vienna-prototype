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
    runCompanyAPI()
    runFlandersAPI()
    console.log('')
    console.log('######################################')
    console.log('Setting up Pod Interfaces')
    console.log('######################################')
    console.log('')
    startPod()
}

async function getDataFlow() {
    
    const solidLib = new SolidLib("food-store");
    await solidLib.login()
    let dataplusplus = await solidLib.getData("?webID <https://www.w3.org/2006/vcard/ns#bday> ?bdate .", [
        "verification",
        "advertisement"
    ])

    console.log('App flow response')
    console.log(dataplusplus)
}

async function run() {
    await setup()

    console.log('')
    console.log('######################################')
    console.log('Running Experiment')
    console.log('######################################')
    console.log('')
    await getDataFlow()
}


run()