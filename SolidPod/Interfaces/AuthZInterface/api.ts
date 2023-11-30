import { AuthZInterfaceResponse } from '../../../SolidLib/Interface/ISolidLib'
import { Server } from 'http';
import express from 'express'

const app = express()
const port = 8050

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
  const requestType = checkRequest(authZRequestMessage.resource)
  console.log(`[${new Date().toISOString()}] - Authz: Request type: ${requestType}.`)
  
  let authZInterfaceResponse: AuthZInterfaceResponse = {
    result: false
  }
  switch (requestType) {
    case ResourceType.POLICY:
      // give token related to owner is allowed to interact with admin
      console.log(`[${new Date().toISOString()}] - Authz: ${actor} (client: ${client_id}) requesting to add policy.`)

      authZInterfaceResponse = {
        result: true,
        authZToken: {
          access_token: "verySecretToken.Allowed-to-add-policy",
          type: 'Bearer' // maybe Dpop, I don't fucking know
        }
      }
      break;
    case ResourceType.LOG:
      // give token related to owner is allowed to interact with log
      console.log(`[${new Date().toISOString()}] - Authz: ${actor} (client: ${client_id}) requesting to add read agreements.`)

      authZInterfaceResponse = {
        result: true,
        authZToken: {
          access_token: "verySecretToken.Allowed-to-read-agreements",
          type: 'Bearer' // maybe Dpop, I don't fucking know
        }
      }
      break;
    case ResourceType.DATA:
      authZInterfaceResponse = await policyNegotiation(authZRequestMessage, client_id, actor)
      break;
    default:
      break;
  }
  let statusCode = 0
  let body: any = {}

  if (authZInterfaceResponse.result) {
    statusCode = 200
    body = authZInterfaceResponse.authZToken
    console.log(`[${new Date().toISOString()}] - Authz: Returning AuthZ token.`)
  }
  else {
    statusCode = 401
    body = authZInterfaceResponse.preObligation
  }


  res.status(statusCode)
    .contentType("application/json")
    .send(body)
  return
})



function parseJwt(token: string) {
  return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
}

function checkRequest(query: string): ResourceType {

  switch (query) {
    case "policy":
      return ResourceType.POLICY
      break;
    case "log":
      return ResourceType.LOG
      break;
    default:
      return ResourceType.DATA
  }

}

enum ResourceType {
  POLICY = "policy",
  DATA = "data",
  LOG = "log"
}

async function policyNegotiation(authZRequestMessage: any, client_id: string, actor: string): Promise<AuthZInterfaceResponse> {
  let authZInterfaceResponse: AuthZInterfaceResponse = {
    result: false
  }
  if (authZRequestMessage.agreement === null) {
    // TODO: get and match policy
    console.log(`[${new Date().toISOString()}] - Authz: "${client_id}" Requesting ${authZRequestMessage['access-mode']} for ${authZRequestMessage.resource} with purpose`, authZRequestMessage.purpose)

    // Policy matching here | stubbed
    // if we have policies, authzresponse should be created based on that and the request
    authZInterfaceResponse = {
      result: false,
      preObligation: {
        type: "signObligation",
        value: {
          actor: actor,
          actorSignature: {
            issuer: "Pod",
            value: "hash"
          },
          "policy": {
            "access-mode": "read",
            "resource": "date_of_birth",
            "purpose": "verification",
            "actor": client_id
          }
        }
      }
    }
    console.log(`[${new Date().toISOString()}] - Authz: "${client_id}" needs to sign this "pod signed Instantiated Policy".`)
  } else {
    // TODO: validate agreement (right now just check validity of signatures)
    // Needs to be done properly 
    console.log(`[${new Date().toISOString()}] - Authz: "${client_id}" Requesting ${authZRequestMessage['access-mode']} for ${authZRequestMessage.resource} with agreement.`)
    console.log(`[${new Date().toISOString()}] - Authz: Verifying agreement.`)
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


    authZInterfaceResponse = {
      result: true,
      authZToken: {
        access_token: "verySecretToken.Allowed-to-read-dob.",
        type: 'Bearer' // maybe Dpop, I don't fucking know
      }
    }
  }
  return authZInterfaceResponse

}


export class AuthZInterface {
  private server: Server | undefined;
  public start(port: number): void {
    this.server = app.listen(port, () => {
      console.log(`Authorization Interface listening on ${port}`)
      console.log(`URI: http://localhost:${port}/`)
    })
  }
  public async stop(): Promise<void> {
    await new Promise<any>(res => this.server?.close(res));
  }
}