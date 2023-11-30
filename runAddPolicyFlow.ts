import { SolidLib } from './SolidLib/Interface/SolidLib';
import { clearStores, setup } from './setup';

async function addPolicy() {
    const solidLib = new SolidLib("admin-App", 'steve');
    await solidLib.login()
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
    const close = await setup('steve')

    console.log('')
    console.log('######################################')
    console.log('Running Experiment')
    console.log('######################################')
    console.log('')
    await addPolicy()
    await close();
}


run()