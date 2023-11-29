import {Session} from "@rubensworks/solid-client-authn-isomorphic";
import {buildAuthenticatedFetch, createDpopHeader, generateDpopKeyPair} from "@inrupt/solid-client-authn-core";

import {SOLID} from "@solid/community-server";
import {turtleStringToStore} from "./Util";
import { DataFactory } from "n3";
const namedNode = DataFactory.namedNode

/**
 * Creates an authenticated fetch using the mail, password and the IDP URL of the given pod.
 *
 * This method has only been tested for CSS v5.0.0
 * e.g. of an IDP URL: http://localhost:3000/idp/
 * @param config
 */
async function authenticatedFetch(config: {
    email: string,
    password: string,
    idp: string,
    tokenEndpoint?: string,
    client: string
}): Promise<(input: RequestInfo | URL, init?: RequestInit | undefined) => Promise<Response>> {
    // fetch id and secret from the client credentials.
    const {email, password, idp, client: appName} = config
    const tokenUrl = config.tokenEndpoint ?? new URL(idp).origin + "/.oidc/token" // note: can retrieve it from {server}/.well-known/openid-configuration (e.g. http://localhost:3000/.well-known/openid-configuration)
    const idpResponse = await fetch(idp)

    // only if 200
    const idpjson: any = await idpResponse.json()

    const credentialURL = idpjson.controls.credentials
    // throw error if undefined (credentialURL)
    const credentialsResponse = await fetch(credentialURL, {
        method: 'POST',
        headers: {'content-type': 'application/json'},
        body: JSON.stringify({email: email, password: password, name: appName}), 
    });

    // only if 200
    const {id, secret} : {id: string, secret: string} = await credentialsResponse.json();


    // Requesting an access token.
    const dpopKey = await generateDpopKeyPair();
    const authString = `${encodeURIComponent(id)}:${encodeURIComponent(secret)}`;
    const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
            // The header needs to be in base64 encoding.
            authorization: `Basic ${Buffer.from(authString).toString('base64')}`,
            'content-type': 'application/x-www-form-urlencoded',
            dpop: await createDpopHeader(tokenUrl, 'POST', dpopKey),
        },
        body: 'grant_type=client_credentials&scope=webid',
    });
    const {access_token: accessToken, expires_in: expires} = await response.json();
    // https://communitysolidserver.github.io/CommunitySolidServer/5.x/usage/client-credentials/#requesting-an-access-token
    // 'The JSON also contains an "expires_in" field in seconds'

    if (accessToken === undefined) {
        throw Error("Authentication failed: password or email are wrong for idp: " + idp)
    }
    console.log("token expires in:", expires, "seconds.")
    // it says types don't match, but they should
    // @ts-ignore
    return await buildAuthenticatedFetch(fetch, accessToken, {dpopKey});
}


async function getIdp(webID: string): Promise<string> {
    const response = await fetch(webID, {
        method: "GET",
        headers: {
            "Accept": 'text/turtle'
        }
    })
    const store = await turtleStringToStore(await response.text())
    const idp = store.getQuads(namedNode(webID), SOLID.terms.oidcIssuer, null, null)[0].object.value
    return idp + 'idp/' // Note: don't know if that should or should not be added.
}

/**
 * Retrieve a {@link Session} containing only an authenticated fetch method.
 * Only applicable for CSS v5.1.0 and up.
 *
 * @param config
 */
export async function getAuthenticatedSession(config: {
    webId: string,
    email: string,
    password: string,
    client: string
}): Promise<Session> {
    const {email, password, client} = config
    const idp = await getIdp(config.webId);     // TODO: use getIdentityProvider from https://github.com/SolidLabResearch/SolidLabLib.js
    const session = new Session()
    try {
        // @ts-ignore
        session.fetch = await authenticatedFetch({email, password, idp, client});
        session.info.isLoggedIn = true
        session.info.webId = config.webId
        session.info.clientAppId = client
    } catch (e: unknown) {
        const error = e as Error
        console.log("Log in not successful for webID: " + config.webId)
        console.log(error.message)
        // fetch is part of session and will have a non-authenticated fetch method
    }

    return session;
}
