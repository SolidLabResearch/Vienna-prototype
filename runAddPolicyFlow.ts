import { SolidLib } from './SolidLib/Interface/SolidLib';
import { clearStores, setup } from './setup';

async function addPolicy() {
    const solidLib = new SolidLib("admin-App", 'steve'); // TODO:: discover steve endpoint from WebID
    await solidLib.login() // Get endpoint through WebID
    await solidLib.addPolicy(`
<myPolicy> <a> <Policy>;
    <subject> <food-store>;
    <action> <read>;
    <resource> <date_of_birth>;
    <context> <verification>.`)

    await solidLib.logout();
}

async function run() {
    clearStores()
    // This mimicks the Pod setup that would happen on the pod hosting server
    const close = await setup('steve')

    console.log('')
    console.log('######################################')
    console.log('Running Experiment')
    console.log('######################################')
    console.log('')
    // This function is called on the client in e.g. a policy administrator application
    await addPolicy()
    await close();
}


run()