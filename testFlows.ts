import { SolidLib } from './SolidLib/Interface/SolidLib';
import { clearStores, setup } from './setup';

const podId = "steve"

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
    Fail = "failure"
}

type FlowRunnerOutput = {
    result: FlowRunnerResult,
    expectedResult: FlowRunnerResult
    type: string
    error?: string
}
abstract class FlowRunner {
    private flowInfo: string;
    protected expectedResult: FlowRunnerResult
    protected foodSolidLib = new SolidLib("food-store", podId);
    protected adminSolidLib = new SolidLib("admin-App", podId);

    constructor(info: string, expectedResult: FlowRunnerResult) {
        this.flowInfo = info
        this.expectedResult = expectedResult

    }

    protected async login() {
        await this.adminSolidLib.login()
        await this.foodSolidLib.login()
    }

    protected async logout() {
        await this.adminSolidLib.logout()
        await this.foodSolidLib.logout()
    }
    public async run(): Promise<FlowRunnerOutput> {
        let result: FlowRunnerOutput = {
            expectedResult: this.expectedResult,
            result: FlowRunnerResult.Fail,
            type: this.flowInfo
        }
        try {

            await this.runFlow()
            result.result = FlowRunnerResult.Success
        } catch (e) {
            result.error = (e as any).message

        }
        return result
    }
    protected abstract runFlow(): Promise<void>
}

class HappyFlow extends FlowRunner {
    constructor() {
        super('Happy Flow', FlowRunnerResult.Success)
    }

    protected async runFlow(): Promise<void> {
        await this.login()

        await this.adminSolidLib.addPolicy(policy)
        await this.foodSolidLib.getData(resourceString, purposes)
        const agreements: [] = await this.adminSolidLib.getLogEntries()
        
        if (agreements.length === 0){
            throw Error('expected agreement')
        }

        await this.logout()
    }
}

class NotLoggedIn extends FlowRunner {
    constructor() {
        super('Not logged in (IDP)', FlowRunnerResult.Fail)
    }

    protected async runFlow(): Promise<void> {
        await this.adminSolidLib.addPolicy(policy)
        await this.foodSolidLib.getData(resourceString, purposes)
        const agreements: [] = await this.adminSolidLib.getLogEntries()
        // if (agreements.length !== 1){
        //     throw Error('expected agreement')
        // }
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
    const flows: FlowRunner[] = [
        new HappyFlow(),
        new NotLoggedIn()
    ]

    const results: FlowRunnerOutput[] = []

    for (const flow of flows) {
        results.push(await flow.run())
    }
    await close();
    clearStores()
    console.log('');
    console.log(`Number of flows implemented: ${results.length}.`);
    console.log(`Number of flows working correctly: ${results.filter(output => output.expectedResult === output.result).length}.`);
    results.forEach(output => console.log(`${output.type} - status: ${output.expectedResult === output.result ? 'succesful': `failure: Error ${output.error}`}`));

    process.exit()

}
main()