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

    console.log('App flow response')
    console.log(dataplusplus)

    await solidLib.logout()
}

async function getAgreements(){
    const solidLib = new SolidLib("admin-App", 'steve');
    await solidLib.login()
    let logEntries = await solidLib.getLogEntries()
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

    await addPolicy();
    await getDataFlow();
    await getAgreements();
    await close();
}

run()