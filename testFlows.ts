import { SolidLib } from './SolidLib/Interface/SolidLib';
import { clearStores, setup } from './setup';

const podId = "steve"
const foodSolidLib = new SolidLib("food-store", podId);
const adminSolidLib = new SolidLib("admin-App", podId);

const resourceString = "?webID <https://www.w3.org/2006/vcard/ns#bday> ?bdate ."
const policy = `
<myPolicy> <a> <Policy>;
    <subject> <food-store>;
    <action> <read>;
    <resource> "${resourceString}";
    <context> <verification>.`
const purposes = ["verification", "advertisment"]
enum FlowRunnerResult {
    Success = "succes",
    Fail ="failure"
}

type FlowRunnerOutput = {
    result: FlowRunnerResult,
    type: string
    error?: string
}
abstract class FlowRunner {
    private flowInfo: string;
    constructor(info: string) {
        this.flowInfo = info
    }
    public async run(): Promise<FlowRunnerOutput> {
        let result: FlowRunnerOutput = {
            result: FlowRunnerResult.Fail,
            type: this.flowInfo
        }
        try {

            await this.runFlow()
            result.result = FlowRunnerResult.Success
        } catch (e) {
            result.error = e as any

        }
        return result
    }
    protected abstract runFlow(): Promise<void>
}

class HappyFlow extends FlowRunner {
    constructor(){
        super('Happy Flow')
    }
    async runFlow(): Promise<void> {
        await adminSolidLib.login()
        await foodSolidLib.login()
        await adminSolidLib.addPolicy(policy)
        await foodSolidLib.getData(resourceString, purposes)
        const agreements:[] = await adminSolidLib.getLogEntries()
        // if (agreements.length !== 1){
        //     throw Error('expected agreement')
        // }
        await adminSolidLib.logout()
        await foodSolidLib.logout()
    }
}
async function main() {
    const close = await setup(podId)
    clearStores()
    console.log('')
    console.log('######################################')
    console.log('Starting multiple flows')
    console.log('######################################')
    console.log('')
    console.log('')
    console.log(await new HappyFlow().run())
    await close();
    clearStores()
}
main()