import { SolidLib } from './SolidLib/Interface/SolidLib';
import { clearStores, setup } from './setup';

async function addPolicy() {
    const solidLib = new SolidLib("admin-App", 'steve');
    await solidLib.login()
    await solidLib.addPolicy(`
<myPolicy> <a> <Policy>;
    <subject> <food-store>;
    <action> <read>;
    <resource> "?webID <https://www.w3.org/2006/vcard/ns#bday> ?bdate .";
    <context> <verification>.`)

    await solidLib.logout();
}

async function getDataFlow() {
    const solidLib = new SolidLib("food-store", 'steve');
    await solidLib.login()
    let dataplusplus = await solidLib.getData("?webID <https://www.w3.org/2006/vcard/ns#bday> ?bdate .", [
        "verification",
        "advertisement"
    ])

    let logEntries = await solidLib.getLogEntries()

    console.log('App flow response')
    console.log(dataplusplus)

    console.log()
    console.log('Logged Agreements:')
    console.log(logEntries)
    await solidLib.logout()
} 

async function run() {
    clearStores()
    const close = await setup('steve')
    await addPolicy()

    console.log('')
    console.log('######################################')
    console.log('Running Experiment')
    console.log('######################################')
    console.log('')
    await getDataFlow()
    await close();
}

run()