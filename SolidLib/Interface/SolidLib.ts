import { Session } from "@rubensworks/solid-client-authn-isomorphic";
import { Action, Agreement, AuthZToken, DataPlus, DataPlusPlus, SolidAuthZRequestMessage } from "./ISolidLib";
import { getAuthenticatedSession } from "../../SolidPod/Util/CSSAuthentication"

export class SolidLib {
    private session: Session | undefined;

    constructor(private client: string) {

    }

    public async login(IDP?: string): Promise<void> {
        require('dotenv').config()

        console.log("[SolidLib]:login - Logging in.")
        // TODO: client hardcoded through passing constructor, should be the login screen in a proper demo
        const webId: string = process.env.WEB_ID!
        const username: string = process.env.USER_NAME!
        const password: string = process.env.PASSWORD!
        const session = await getAuthenticatedSession({
            webId: webId,
            email: username,
            password: password,
            client: this.client
        })

        if (session.info.isLoggedIn) {
            console.log(`[SolidLib]:login - Logged in.\n(web-id: ${session.info.webId} | client-id: ${session.info.clientAppId})`)
        } else {
            console.log(`[SolidLib]:login - Failed logging in.`)
        }
        this.session = session
    }

    public async getData(query: string, purpose: string[]): Promise<DataPlusPlus> {
        // TODO:: how to get NAME value here?
        const dataInterfaceURI = "http://localhost:8040/bob/endpoint"
        // stubbed: Don't have access
        console.log(`SolidLib]:getData - No access, need AuthZ token.`)
        const authZRequestMessage: SolidAuthZRequestMessage = {
            authNToken: {
                WebID: this.session?.info.webId ?? "",
                Client: this.session?.info.clientAppId ?? "",
                Issuer: "" // TODO:
            },
            action: Action.Read,
            query: query,
            purpose: purpose,
            agreement: undefined
        }

        const { token: authZToken, agreements: resultingAgreements } = await this.getAuthZToken(authZRequestMessage)

        console.log(`SolidLib]:getData - Now that token is there, fetch data`, authZToken)

        if (!this.session) {
            throw Error("No session")
        }

        let response = await this.session.fetch(dataInterfaceURI, {
            method: "POST",
            headers: {
                "content-type": "text/n3"
            },
            body: query
        })

        let code = response.status;

        let text = await response.text();

        if (code !== 200) {
            console.error(`Data request failed: ${text}`)
            return {data: {data: ""}, agreements: resultingAgreements};
        }


        let data : DataPlus =  { data: text }

        // TODO:: WOUT :: How to get Agreements to here?

        let responseObject: DataPlusPlus = {
            data,
            agreements: resultingAgreements,
        }

        return responseObject;

    }

    public async getDataWithTrust(query: string, purpose: string[]): Promise<any> {
        let dataplusplus = await this.getData(query, purpose)
        
        // TODO:: JESSE :: whatever u want
    }

    public async addPolicy(policy: string): Promise<boolean> {
        const adminInterfaceUrl = "http://localhost:8060/"

        if (!this.session) {
            throw Error("No session")
        }

        let response = await this.session.fetch(adminInterfaceUrl, {
            method: "POST",
            headers: {
                "content-type": "text/turtle"
            },
            body: policy
        })

        if (response.status === 200) {
            return true
        }

        console.log(`SolidLib]:addPolicy - No access, need AuthZ token.`)
        const authZRequestMessage: SolidAuthZRequestMessage = {
            authNToken: {
                WebID: this.session?.info.webId ?? "",
                Client: this.session?.info.clientAppId ?? "",
                Issuer: "" // TODO:
            },
            action: Action.Write,
            query: "policy"
        }
        const authZToken = await (await this.getAuthZToken(authZRequestMessage)).token
        console.log(`SolidLib]:addPolicy - Now that token is there, add Policy`, authZToken)

        response = await fetch(adminInterfaceUrl, {
            method: "POST",
            headers: {
                authorization: `${authZToken.type} ${authZToken.access_token}`,
                "content-type": "text/turtle"
            },
            body: policy
        })
        if (response.status === 200) {
            return true
        }
        throw Error("Some unknown error made it that the policy was not added")

    }

    private async getAuthZToken(authZRequestMessage: SolidAuthZRequestMessage): Promise<{ token: AuthZToken, agreements: Agreement[]} > {
        const AuthZInterfaceURL = "http://localhost:8050/" // Note: hardcoded
        const agreements : Agreement[] = []
        if (!this.session) {
            throw Error("No session")
        }

        console.log(`[SolidLib]:getAuthZToken - Requesting Authorization token at ${AuthZInterfaceURL}.`)
        const res = await this.session.fetch(AuthZInterfaceURL, {
            method: "POST",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify({
                "access-mode": authZRequestMessage.action,
                "resource": authZRequestMessage.query,
                "purpose": authZRequestMessage.purpose,
                "agreement": authZRequestMessage.agreement ?? null
            })
        })

        let token: AuthZToken = {
            access_token: "",
            type: ""
        }

        if (res.status === 401) {
            const preObligationRequest: any = await res.json()
            console.log(`[SolidLib]:getAuthZToken - No Authorization token received; Received status code ${res.status} with following error message: ${preObligationRequest.type}.`)
            console.log(`[SolidLib]:getAuthZToken - Signing "pod signed Instantiated Policy".`)

            // Note: maybe this can be recursive?
            // signing here and storing in agreement
            const agreement = {
                owner: preObligationRequest.value.actor,
                ownerSignature: preObligationRequest.value.actorSignature,
                consumer: this.session.info.clientAppId,
                consumerSignature: {
                    issuer: this.session.info.clientAppId,
                    value: "hash"
                },
                policy: preObligationRequest.value.policy
            }

            // TODO:: WOUT :: Like this?
            agreements.push(agreement as Agreement);

            const agreementResponse = await this.session.fetch(AuthZInterfaceURL, {
                method: "POST",
                headers: {
                    "content-type": "application/json"
                },
                body: JSON.stringify({
                    "access-mode": Action.Read,
                    "resource": authZRequestMessage.query,
                    "purpose": [],
                    "agreement": agreement
                })
            })

            if (agreementResponse.status === 200) {
                console.log(`[SolidLib]:getAuthZToken - Retrieved an AuthZ token to ${agreement.policy["access-mode"]} ${agreement.policy.resource}.`)
                token = await agreementResponse.json() as any
            } else {
                console.log('[SolidLib]:getAuthZToken - Failed to retrieve an AuthZ token.')
            }
        } else {
            console.log(`[SolidLib]:getAuthZToken - Retrieved an AuthZ token (no agreements).`)
            token = await res.json() as any
        }
        return { token, agreements }
    }
}

