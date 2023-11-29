import {SolidLib} from './SolidLib/Interface/SolidLib'

async function main(){
    const solidLib = new SolidLib("food-store");
    await solidLib.login()
    await solidLib.getData("date_of_birth", [
        "verification",
        "advertisement"
    ])
}
main()