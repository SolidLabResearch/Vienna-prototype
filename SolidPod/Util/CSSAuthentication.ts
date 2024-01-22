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
    client: string,
    webId: string,
}): Promise<(input: RequestInfo | URL, init?: RequestInit | undefined) => Promise<Response>> {
    // fetch id and secret from the client credentials.
    const {email, password, idp, client: appName, webId} = config
    console.log('CONFIG', config)

    const idpControlsURI = idp+'.account/'

    const IDPControls = await (await fetch (idpControlsURI)).json()
    const loginInfo = await (await fetch (IDPControls.controls.password.login, {
        method: "POST",
        "headers": {
            "Content-Type": "application/json"
        }, body: JSON.stringify({email, password})
    })).json()

    let authorizationCode = loginInfo.authorization;
    let authorizedControls = await (await fetch (idpControlsURI, {
        headers: {
            "Accept": "application/json",
            "Authorization": `CSS-Account-Token ${authorizationCode}`
        }
    })).json()


    // only if 200

    // throw error if undefined (credentialURL)
    const credentialsResponse = await (await fetch(authorizedControls.controls.account.clientCredentials, {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            "Authorization": `CSS-Account-Token ${authorizationCode}`
        },
        body: JSON.stringify({name: appName, webId: webId}), 
    })).json();

    // only if 200
    const {id, secret} : {id: string, secret: string} = credentialsResponse;

    const wellKnown = await (await fetch(idp+'.well-known/openid-configuration')).json()
    const tokenUrl = wellKnown.token_endpoint

    console.log('tokenUrl', tokenUrl, wellKnown, idp+'.well-known/openid-configuration')
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
    return idp //+ '.account/' //+ 'idp/' // Note: don't know if that should or should not be added.
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
    const {email, password, client, webId} = config
    const idp = await getIdp(config.webId);     // TODO: use getIdentityProvider from https://github.com/SolidLabResearch/SolidLabLib.js
    const session = new Session()
    try {
        // @ts-ignore
        session.fetch = await authenticatedFetch({email, password, idp, client, webId});
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
