import { Agreement, AuthZInterfaceResponse, AuthZInterfaceResponseResult, Policy } from '../../../SolidLib/Interface/ISolidLib'
import { Server } from 'http';
import express, { query } from 'express'
import { PolicyStore } from '../../Util/Storage';
import { Store, DataFactory } from 'n3';
import { storeToString } from '../../Util/Util';
import { ServiceInfo } from '../..';
import { PublicInterface } from '../PublicInterface';
import { PolicyStorageComponent } from '../../Components/Storage/PolicyStorageComponent';
const { namedNode } = DataFactory
const app = express()

enum ResourceType {
  POLICY = "policy",
  DATA = "data",
  LOG = "log"
}

export class AuthZInterface extends PublicInterface {
  
  app?: express.Application;
  server: Server | undefined;
  store: PolicyStorageComponent;

  constructor(info: ServiceInfo, store: PolicyStorageComponent) {
      super(info)
      this.store = store;
  }

  public async start(port: number) {
    this.app = express();
    await this.startService()

    this.server = app.listen(port, () => {
      console.log(`Authorization Interface listening on ${port}`)
      console.log(`URI: http://localhost:${port}/`)
    })
  }

  public async stop() {
    await new Promise<any>(res => this.server?.close(res));
  }

  private startService() {

    app.use(express.json())

    app.post('/', async (req, res) => {
      // validate AuthN token
      console.log(`[${new Date().toISOString()}] - Authz: Verifying authN token.`);
    
      // note: verification token is stubbed
      if (!req.headers.authorization) {
        res
          .status(401)
          .contentType("application/json")
          .send({ error: "No Auth Token" })
        return
      }
    
      const authNHeader = req.headers.authorization
      const authNToken = authNHeader.split(" ")[1]
      const clientSession = parseJwt(authNToken)
    
      console.log(`[${new Date().toISOString()}] - Authz: AuthN token: OK.`);
    
      const client_id = clientSession.client_id.split("_")[0] // don't want random uuid
      const actor = clientSession.webid
    
      // parse body
      if (!req.headers['content-type']) {
        res
          .status(400)
          .contentType("application/json")
          .send({ error: "No content type" })
        return
      }
      const authZRequestMessage = req.body
    
      // checking what the target is for the resource | data or policies
      const requestType = this.checkRequest(authZRequestMessage.resource)
      console.log(`[${new Date().toISOString()}] - Authz: Request type: ${requestType}.`)
    
      let authZInterfaceResponse: AuthZInterfaceResponse = {
        result: AuthZInterfaceResponseResult.Error
      }
    
      switch (requestType) {
        case ResourceType.POLICY:
          // give token related to owner is allowed to interact with admin
          console.log(`[${new Date().toISOString()}] - Authz: ${actor} (client: ${client_id}) requesting to add policy.`)
          if (client_id !== "admin-App") {
            console.log(`[${new Date().toISOString()}] - Authz: SHOULD NOT BE ALLOWED TO GET A TOKEN DUE TO WRONG APP.`)
          } else {
            authZInterfaceResponse = {
              result: AuthZInterfaceResponseResult.Token,
              authZToken: {
                access_token: "solid.policy-add",
                type: 'Bearer' // maybe Dpop, I don't fucking know
              }
            }
          }
          
          break;
        case ResourceType.LOG:
          // give token related to owner is allowed to interact with log
          console.log(`[${new Date().toISOString()}] - Authz: ${actor} (client: ${client_id}) requesting to add read agreements.`)
          // TODO:: I don't think we want to hardcode this? This should just be part of the policies.
          if (client_id !== "admin-App") {
            console.log(`[${new Date().toISOString()}] - Authz: SHOULD NOT BE ALLOWED TO GET A TOKEN DUE TO WRONG APP.`)
            authZInterfaceResponse = {
              error: "Authz: SHOULD NOT BE ALLOWED TO GET A TOKEN DUE TO WRONG APP.",
              result: AuthZInterfaceResponseResult.Error
            }
          } else {
            authZInterfaceResponse = {
              result: AuthZInterfaceResponseResult.Token,
              authZToken: {
                access_token: "verySecretToken.Allowed-to-read-agreements",
                type: 'Bearer' // maybe Dpop, I don't fucking know
              }
            }
          }
          break;
        case ResourceType.DATA:
          authZInterfaceResponse = await this.policyNegotiation(authZRequestMessage, client_id, actor)
          break;
        default:
          break;
      }
      let statusCode = 0
      let body: any = {}
    
      switch (authZInterfaceResponse.result) {
        case (AuthZInterfaceResponseResult.Token):
          statusCode = 200
          body = authZInterfaceResponse.authZToken
          console.log(`[${new Date().toISOString()}] - Authz: Returning AuthZ token.`)
          break;
        case (AuthZInterfaceResponseResult.Obligation):
          statusCode = 401
          body = authZInterfaceResponse.preObligation
          break;
        case AuthZInterfaceResponseResult.Error:
          statusCode = 401
          body = { error: authZInterfaceResponse.error }
          break;
    
      }
    
      res.status(statusCode)
        .contentType("application/json")
        .send(body)
      return
    })    
  }


  // TODO: form proper authZRequestMessage (see interfaces)
  private async policyNegotiation(authZRequestMessage: any, client_id: string, actor: string): Promise<AuthZInterfaceResponse> {
    let authZInterfaceResponse: AuthZInterfaceResponse = {
      result: AuthZInterfaceResponseResult.Error

    }
    if (authZRequestMessage.agreement === null) {
      console.log(`[${new Date().toISOString()}] - Authz: "${client_id}" Requesting ${authZRequestMessage['access-mode']} for ${authZRequestMessage.resource} with purpose`, authZRequestMessage.purpose)
      const policy = await this.matchPolicy({
        subject: client_id,
        action: authZRequestMessage["access-mode"],
        resource: authZRequestMessage.resource,
        purpose: authZRequestMessage.purpose
      })
      if (!policy) {
        authZInterfaceResponse.error = 'no policy match'
        return authZInterfaceResponse
      }
      // if we have policies, authzresponse should be created based on that and the request
      authZInterfaceResponse = {
        result: AuthZInterfaceResponseResult.Obligation,
        preObligation: {
          type: "signObligation",
          value: {
            actor: actor,
            actorSignature: {
              issuer: "Pod",
              value: "hash"
            },
            "policy": policy
          }
        }
      }
      console.log(`[${new Date().toISOString()}] - Authz: "${client_id}" needs to sign this "pod signed Instantiated Policy".`)
    } else { // There is an Agreement
      console.log(`[${new Date().toISOString()}] - Authz: "${client_id}" Requesting ${authZRequestMessage['access-mode']} for ${authZRequestMessage.resource} with agreement.`)
      console.log(`[${new Date().toISOString()}] - Authz: Verifying agreement.`)
      // validate agreement (right now just check validity of signatures)
      // Needs to be done properly 
      const valid = this.verifyAgreement(authZRequestMessage.agreement, { client_id, webId: actor })
      switch (valid) {
        case true:
          authZInterfaceResponse = {
            result: AuthZInterfaceResponseResult.Token,
            authZToken: {
              access_token: "verySecretToken.Allowed-to-read-dob.",
              type: 'Bearer' // maybe Dpop, I don't fucking know
            }
          }
          console.log(`[${new Date().toISOString()}] - Authz: Agreement verified: Storing it to [Log Store].`)
          // Store log 
          // TODO:: get URL instead of hardcoding it
          await fetch("http://localhost:8030", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(authZRequestMessage.agreement)
          })
          break;
        case false:
          console.log(`[${new Date().toISOString()}] - Authz: Agreement could not be verified.`)
          authZInterfaceResponse = {
            result: AuthZInterfaceResponseResult.Error,
            error: "Agreement could not be verified"
          }
          break;

      }


    }
    return authZInterfaceResponse

  }

  private checkRequest(query: string): ResourceType {

    switch (query) {
      case "policy":
        return ResourceType.POLICY
      case "log":
        return ResourceType.LOG
      default:
        return ResourceType.DATA
    }

  }


  private async matchPolicy(args: {
    subject: string,
    action: string,
    resource: string,
    purpose: string[]
  }): Promise<Policy | undefined> {
    // getPolicy (should loop over all policies)
    let policy: Policy | undefined
    const storedPolicies = await this.store.getPolicies();

    for (const policyQuadList of storedPolicies) {
      let policyStore = new Store()
      policyStore.addQuads(policyQuadList);
      const policySubject = policyStore.getQuads(null, namedNode('subject'), null, null)[0].object.value;
      const policyAction = policyStore.getQuads(null, namedNode('action'), null, null)[0].object.value;
      const policyResource = policyStore.getQuads(null, namedNode('resource'), null, null)[0].object.value;
      const policyContext = policyStore.getQuads(null, namedNode('context'), null, null)[0].object.value;
      // match policy (currently matches last policy that matches if there are multiple matches)

      if (policySubject === args.subject &&
        policyAction === args.action &&
        policyResource === args.resource &&
        args.purpose.some(v => v === policyContext)) {
        // the policy is instantiated based on what is in the store | that is all the negotiation fo rnow
        // console.log({
        //   "access-mode": policyAction,
        //   "resource": policyResource,
        //   "purpose": policyContext,
        //   "actor": policySubject
        // });
        console.log(`[${new Date().toISOString()}] - Authz-Policy-Matching: Found a match.`)
        policy = {
          "access-mode": policyAction,
          actor: policySubject,
          resource: policyResource,
          purpose: policyContext
        }
      } else {
        console.log(`[${new Date().toISOString()}] - Authz-Policy-Matching: No match found.`)

      }
    }

    return policy
  }

  private verifyAgreement(agreement: Agreement, authNToken: { client_id: string; webId: string }): boolean {
    // verify own signature over policy: verify if it is our own signed instantiated policy
    console.log(agreement);
    
    //TOOD:: fix this with agreements as quads
    
    // if (agreement.owner === authNToken.webId && agreement.ownerSignature.issuer !== "Pod"){
    //   return false
    // }
    // // verify signature of consumer: is the consumer correct in the agreement
    // if (agreement.consumer !== authNToken.client_id) {
    //   return false
    // }

    return true
  }

}

function parseJwt(token: string) {
  return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
}