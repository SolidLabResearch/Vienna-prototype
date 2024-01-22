import { IDPServer } from "./setup";



async function run() {

    const idpServer = new IDPServer();

    await idpServer.start(7834)


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
        await idpServer.stop();
        process.exit()
    })
}


run()