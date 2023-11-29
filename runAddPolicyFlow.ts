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

function timeout(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
    const close = await setup()

    await timeout(500);
    
    console.log('')
    console.log('######################################')
    console.log('Running Experiment')
    console.log('######################################')
    console.log('')
    await addPolicy()
    await close();
}


run()