import { SolidLib } from './SolidLib/Interface/SolidLib';
import { setup } from './setup';

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