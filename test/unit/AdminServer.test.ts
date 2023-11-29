// just testing the admin server individually by giving a mock token

import { Session } from "@rubensworks/solid-client-authn-isomorphic"
import { getAuthenticatedSession } from "../../SolidPod/Util/CSSAuthentication"
import { AdminInterface } from "../../SolidPod/Interfaces/AdminInterface/api"


const port = 8060
const adminServerURL = `http://localhost:${port}/`

describe('an Admin Interface request', () => {
    let mgmtSession: Session;
    let adminInterface: AdminInterface;
    const verySecretToken = "Bearer verySecretToken.Allowed-to-add-policy"

    beforeAll(async () => {
        // TODO: run admin server; currently assumes admin server is running at port 8060

        require('dotenv').config()
        adminInterface = new AdminInterface()
        adminInterface.start(port)

        const webId: string = process.env.WEB_ID!
        const username: string = process.env.USER_NAME!
        const password: string = process.env.PASSWORD!
        const client: string = "mgmt-app"
        mgmtSession = await getAuthenticatedSession({
            webId: webId,
            email: username,
            password: password,
            client: client
        })
    })
    afterAll( () => {
// adminInterface.stop()
    })

    it('with no Authorization token fails.', async () => {
        const response = await fetch(adminServerURL, { method: "POST" });
        expect(response.status).toBe(401);
        expect(await response.json()).toEqual({ error: "No AuthZ Token" })
    })

    it('with a Solid-OIDC Authorization token fails.', async () => {
        const response = await mgmtSession.fetch(adminServerURL, { method: "POST" })
        expect(response.status).toBe(401);
        expect(await response.json()).toEqual({ error: "Incorrect AuthZ Token" })
    })

    it('with a very secret token but without body fails.', async () => {
        const response = await fetch(adminServerURL, {
            method: "POST",
            headers: {
                "Authorization": verySecretToken
            }
        })
        expect(response.status).toBe(400);
        expect(await response.json()).toEqual({ error: "No body" })
    })

    it('with a very secret token and with a policy succeeds.', async () => {
        const response = await fetch(adminServerURL, {
            method: "POST",
            headers: {
                "Authorization": verySecretToken,
                "content-type":"text/turtle"
            }
        })
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ info: "Policy added" })
    })
})