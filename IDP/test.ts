import { IDPServer } from "./setup";

async function run() {
    let server = new IDPServer();

    server.start(9983)


    const keypress = async () => {
        process.stdin.setRawMode(true)
        return new Promise<void>(resolve => process.stdin.once('data', () => {
        process.stdin.setRawMode(false)
        resolve()
        }))
    }

    ;(async () => {
        await keypress()
    })().then(async() => {
        console.log('Endpoints closed by keypress')
        await close();
        process.exit()
    })

}

run()