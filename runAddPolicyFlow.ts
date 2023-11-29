import { SolidLib } from './SolidLib/Interface/SolidLib'

async function addPolicy() {
    const solidLib = new SolidLib("admin-App");
    await solidLib.login()
    await solidLib.addPolicy(`
<myPolicy> <a> <Policy>;
    <subject> <food-store>;
    <action> <read>;
    <resource> <date_of_birth>;
    <context> <verification>.`)

}

addPolicy()
