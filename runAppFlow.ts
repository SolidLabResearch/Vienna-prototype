import { SolidLib } from './SolidLib/Interface/SolidLib';
import { setup } from './setup';

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

async function getDataFlow() {
    const solidLib = new SolidLib("food-store");
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
    const close = await setup()

    console.log('')
    console.log('######################################')
    console.log('Running Experiment')
    console.log('######################################')
    console.log('')

    await addPolicy();
    await getDataFlow()
    await close();
}

run()