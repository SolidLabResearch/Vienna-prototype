import { write } from "@jeswr/pretty-turtle/dist";
import { Session } from "@rubensworks/solid-client-authn-isomorphic";
import { n3reasoner } from "eyereasoner/dist";
import { DataFactory as DF, DataFactory, Parser, Store } from "n3";
import { getAuthenticatedSession } from "../../SolidPod/Util/CSSAuthentication";
import { Action, Agreement, AuthZToken, DataPlus, DataPlusPlus, SolidAuthZRequestMessage } from "./ISolidLib";
import { validateSignatures } from "../../packaging/validateSignatures";

const { namedNode } = DataFactory

export class SolidLib {
    // hardcoded interface Urls
    private session: Session | undefined;

    private readonly prefixes = {
        pack: 'https://example.org/ns/package#',
        odrl: 'http://www.w3.org/ns/odrl/2/',
        sign: 'https://example.org/ns/signature#',
        dc: 'http://purl.org/dc/terms/',
        xsd: 'http://www.w3.org/2001/XMLSchema#',
        vcard: 'https://www.w3.org/2006/vcard/ns#',
        policy: 'https://example.org/ns/policy#'
    }

    private readonly trust = `
    @prefix : <http://example.org/> .
    @prefix rot: <https://purl.org/krdb-core/rot/rot#> .

    :globals :user :Jesse .
    :Jesse rot:trusts <http://localhost:3456/flandersgov/id> .
  `

    constructor(private client: string, private webId: string) {

    }

    public async loadInterfaces() {
        console.log("loading from", this.webId)
        const webIdData = await (await fetch(this.webId)).text()
        const store = new Store(new Parser({ format: 'text/n3' }).parse(webIdData));
        let interfaceEndpoints = {
            "admin": store.getQuads(null, "http://example.org/ns/adminEndpoint", null, null)[0].object.value,
            "authZ": store.getQuads(null, "http://example.org/ns/authZEndpoint", null, null)[0].object.value,
            "data": store.getQuads(null, "http://example.org/ns/dataEndpoint", null, null)[0].object.value,
            "log": store.getQuads(null, "http://example.org/ns/logEndpoint", null, null)[0].object.value,
        }
        return interfaceEndpoints
    }

    public async login(webId?: string, email?: string, password?: string ): Promise<void> {
        require('dotenv').config()

        console.log("[SolidLib]:login - Logging in.")
        // TODO: client hardcoded through passing constructor, should be the login screen in a proper demo
        webId = webId || process.env.WEB_ID!
        email = email || process.env.USER_NAME!
        password = password || process.env.PASSWORD!
        const session = await getAuthenticatedSession({
            webId,
            email,
            password,
            client: this.client
        })
        console.log(session.info)

        if (session.info.isLoggedIn) {
            console.log(`[SolidLib]:login - Logged in.\n(web-id: ${session.info.webId} | client-id: ${session.info.clientAppId})`)
        } else {
            console.log(`[SolidLib]:login - Failed logging in.`)
        }
        this.session = session
    }

    public async logout(): Promise<void> {
        return this.session?.logout();
    }

    public async getData(query: string, purpose: string[]): Promise<DataPlusPlus> {
        let interfaceEndpoints = await this.loadInterfaces()
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
        let authZToken: AuthZToken;
        let resultingAgreements: Agreement[];
        try {
            const tokenCall = await this.getAuthZToken(authZRequestMessage)
            authZToken = tokenCall.token
            resultingAgreements = tokenCall.agreements
        } catch (e) {
            console.log(`[SolidLib]:getData - No token obtained.`)
            throw e

        }

        console.log(`[SolidLib]:getData - Now that token is there, fetch data`, authZToken)

        if (!this.session) {
            throw Error("No session")
        }

        // session.fetch already has a lot of stuff in the authorization token
        let response = await fetch(interfaceEndpoints.data, {
            method: "POST",
            headers: {
                "content-type": "text/n3",
                "authorization": `${authZToken.type} ${authZToken.access_token}`,
            },
            body: query
        })

        let code = response.status;

        let text = await response.text();

        if (code !== 200) {
            console.error(`Data request failed: ${text}`)
            return { data: { data: "" }, agreements: resultingAgreements };
        }


        let data: DataPlus = { data: text }

        let responseObject: DataPlusPlus = {
            data,
            agreements: resultingAgreements,
        }

        return responseObject;

    }

    public async getDataWithTrust(query: string, purpose: string[]): Promise<DataPlusPlus> {
        let dataplusplus = await this.getData(query, purpose);

        const store = new Store(new Parser({ format: 'text/n3' }).parse(dataplusplus.data.data));

        await validateSignatures(store);
        const reasoningResult = await n3reasoner([await write([...store], {
            format: 'text/n3',
            prefixes: this.prefixes,
        }), `
      @prefix log: <http://www.w3.org/2000/10/swap/log#> .
      @prefix dcterms: <http://purl.org/dc/terms/>.
      @prefix odrl: <http://www.w3.org/ns/odrl/2/>.
      @prefix pack: <https://example.org/ns/package#>.
      @prefix policy: <https://example.org/ns/policy#>.
      @prefix sign: <https://example.org/ns/signature#>.
      @prefix xsd: <http://www.w3.org/2001/XMLSchema#>.
      @prefix rot: <https://purl.org/krdb-core/rot/rot#> .
      @prefix : <http://example.org/> .
    
      // The next three rules connect the contents with all parent packages, 
      // to then enact the required rules over them
      {
        ?pack pack:packages ?package .
        ?package log:includes { [] pack:content ?content } .
        ?content log:includes { [] pack:packages ?p1 } .
      } => {
        [] pack:flatPackages ?p1
      } .
    
      {
        ?pack pack:packages ?package .
      } => {
        [] pack:flatPackages ?package
      } .
    
      {
        ?pack pack:flatPackages ?package .
        ?package log:includes { [] pack:content ?content } .
        ?content log:includes { [] pack:packages ?p1 } .
      } => {
        [] pack:flatPackages ?p1
      } .
    
      {
        ?pack pack:flatPackages ?package .
        ?package log:includes {
          [] sign:signatureHasBeenVerified true;
            sign:hasContentSignature [
              sign:issuer ?issuer
            ]  
        } .
      } => {
        [] pack:packages ?package ;
          pack:assertedBy ?issuer .
      } . 
      
      {
        ?pack pack:packages ?package .
        ?package log:includes { [] pack:content ?content } .
    
        ?pack pack:assertedBy ?issuer .
        :globals :user [ 
          rot:trusts ?issuer 
        ] .
      } => ?content .
      `, this.trust]);

        const reasonedStore = new Store(new Parser({ format: 'text/n3' }).parse(reasoningResult));

        const data = [...reasonedStore.match(null, null, null, DF.defaultGraph())].filter(
            term => (term.object.termType !== 'BlankNode' || reasonedStore.match(null, null, null, term.object as any).size === 0)
                && !term.predicate.equals(namedNode('https://example.org/ns/package#assertedBy'))
        )

        return {
            data: {
                data: await write(data, {
                    prefixes: this.prefixes,
                    format: 'text/n3'
                })
            },
            agreements: dataplusplus.agreements
        }
    }

    // Admin only
    public async addPolicy(policy: string): Promise<boolean> {
        if (!this.session) {
            throw Error("No session")
        }
        let interfaceEndpoints = await this.loadInterfaces()

        let response = await this.session.fetch(interfaceEndpoints.admin, {
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

        response = await fetch(interfaceEndpoints.admin, {
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

    // note: Wout comment: I think it will only be one agreement per authztoken.
    private async getAuthZToken(authZRequestMessage: SolidAuthZRequestMessage): Promise<{ token: AuthZToken, agreements: Agreement[] }> {
        let interfaceEndpoints = await this.loadInterfaces()
        const agreements: Agreement[] = []
        if (!this.session) {
            throw Error("No session")
        }
        

        console.log(`[SolidLib]:getAuthZToken - Requesting Authorization token at ${interfaceEndpoints.authZ}.`)
        const res = await this.session.fetch(interfaceEndpoints.authZ, {
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
            console.log(`[SolidLib]:getAuthZToken - No Authorization token received; Received status code ${res.status} with following error message: ${preObligationRequest.type ?? preObligationRequest.error}.`)
            if (preObligationRequest.error) {
                throw Error(preObligationRequest.error)
            }
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

            // TODO:: fix this with quads

            agreements.push([]) //agreement as Agreement;

            const agreementResponse = await this.session.fetch(interfaceEndpoints.authZ, {
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

    // Admin only
    public async getLogEntries(): Promise<[]> {
        let interfaceEndpoints = await this.loadInterfaces()
        const authZRequestMessage: SolidAuthZRequestMessage = {
            authNToken: {
                WebID: this.session?.info.webId ?? "",
                Client: this.session?.info.clientAppId ?? "",
                Issuer: "" // TODO:
            },
            action: Action.Read,
            query: "log"
        }
        const authZToken = await (await this.getAuthZToken(authZRequestMessage)).token
        console.log(`SolidLib]:addPolicy - Now that token is there, add Policy`, authZToken)
        
        let response = await fetch(interfaceEndpoints.log, {
            method: "GET",
            headers: {
                authorization: `${authZToken.type} ${authZToken.access_token}`,
            },
        })
        let agreementList = await response?.json()

        return agreementList
    }
}

