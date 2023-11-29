import {SolidLib} from './SolidLib/Interface/SolidLib'

async function main(){
    const solidLib = new SolidLib("food-store");
    await solidLib.login()
    let dataplusplus = await solidLib.getData("?webID <https://www.w3.org/2006/vcard/ns#bday> ?bdate .", [
        "verification",
        "advertisement"
    ])

    console.log('RESPONSE', dataplusplus)
}
main()