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

async function addPolicy() {
    const solidLib = new SolidLib("admin-App");
    await solidLib.login()
    await solidLib.addPolicy(`
<myPolicy> <a> <Policy>;
    <subject> <food-store>;
    <action> <read>;
    <resource> <date_of_birth>;
    <context> <verification>.`)

    await solidLib.logout();
}

function timeout(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
    await setup()

    await timeout(500);
    
    console.log('')
    console.log('######################################')
    console.log('Running Experiment')
    console.log('######################################')
    console.log('')
    await addPolicy()
}


run()