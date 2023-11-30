import { SolidLib } from './SolidLib/Interface/SolidLib';
import { clearStores, setup } from './setup';

async function getDataFlow() {
    
    const solidLib = new SolidLib("food-store", 'steve');
    await solidLib.login()

    let dataplusplustrusted = await solidLib.getDataWithTrust("?webID ?predicate ?bdate .", [
        "verification",
        "advertisement"
    ])

    let logEntries = JSON.stringify(await solidLib.getLogEntries(), null, 2)

    console.log('Trusted app flow response')
    console.log(dataplusplustrusted)

    console.log()
    console.log('Logged Agreements:')
    console.log(logEntries)
    await solidLib.logout()

}

async function run() {
    clearStores()
    const close = await setup('steve')

    console.log('')
    console.log('######################################')
    console.log('Running Experiment')
    console.log('######################################')
    console.log('')
    await getDataFlow()
    await close();
}


run()