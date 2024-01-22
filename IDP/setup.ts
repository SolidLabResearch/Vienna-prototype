import { App, AppRunner, joinFilePath } from '@solid/community-server';
import { PublicInterface } from '../SolidPod/Interfaces/PublicInterface';


export class IDPServer {
  
  app?: App;

  async start(port: number): Promise<void> {
    // This creates an App, which can be used to start (and stop) a CSS instance
    this.app = await new AppRunner().create(
      {
        // For testing we created a custom configuration that runs the server in memory so nothing gets written on disk.
        config: joinFilePath(__dirname, './idpconfig.json'),
        loaderProperties: {
          // Tell Components.js where to start looking for component configurations.
          // We need to make sure it finds the components we made in our project
          // so this needs to point to the root directory of our project.
          mainModulePath: joinFilePath(__dirname, '../'),
          // We don't want Components.js to create an error dump in case something goes wrong with our test.
          dumpErrorState: false,
        },
        // We use the CLI options to set the port of our server to 3456
        // and disable logging so nothing gets printed during our tests.
        // Should you have multiple test files, it is important they all host their test server
        // on a different port to prevent conflicts.
        shorthand: {
          port,
          loggingLevel: 'off',
        },
        // We do not use any custom Components.js variable bindings and set our values through the CLI options below.
        // Note that this parameter is optional, so you can just drop it.
        variableBindings: {}
      }
    );

    // This starts with the settings provided above
    await this.app.start();
    console.log(`started IDP service at localhost:${port}`)
  }

  async stop(): Promise<void> {
    if (this.app) await this.app.stop();
  }

}

