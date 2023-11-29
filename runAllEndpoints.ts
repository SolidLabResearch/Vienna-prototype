import { SolidLib } from './SolidLib/Interface/SolidLib';
import { setup } from './setup';

async function run() {
  const close = await setup()

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