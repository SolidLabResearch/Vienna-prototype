export type Query = any;

export type Session = {
    authNToken: AuthNToken;
}

export type AuthNToken = {
    WebID: string,
    Client: string,
    Issuer: string
}

export type AuthZToken = {
    access_token: string,
    type: string
}

export type Policy = string

export type DataPlusPlus = {
    agreements: Agreement[],
    data: DataPlus,
}

export type Agreement = {
    owner: string
    ownerSignature: Signature,
    consumer: string,
    consumerSignature: Signature,
    policy: InstantiatedPolicy;

}

// export type DataPlus = {
//     dataSignature: string,
//     dataProvenance: string[],
//     data: string
// }

export type DataPlus = {
    data: string
}

export type Signature = {
    issuer: string,
    value: string
}

export type InstantiatedPolicy = {
    actor: string,
    resource: string,
    purpose: string,
    "access-mode": string
};

export type SignedInstantiatedPolicy = {
    actor: string,
    actorSignature: Signature,
    policy: InstantiatedPolicy,
}

export type PreObligationRequest = {
    type: string,
    value: SignedInstantiatedPolicy,
}

export type Purpose = string;

export enum Action {
    Read = "read",
    Write = "write"
}

export enum ErrorMessage {
    NeedsAuthZToken
}

export interface ISolidAwareLib {
    session: Session;
    authZToken: AuthZToken; // This needs to go somewhere inside the getData and addPolicy functions;

    login: (idpURI?: string) => Promise<boolean>; // Token is stored in the session object

    getData: (query: Query, purpose: Purpose[]) => Promise<DataPlusPlus> // get AuthNToken from session

    addPolicy: (policy: Policy) => Promise<boolean> // get AuthNToken from session
}

// messages 
export type SolidDataRequestMessage = {
    query: Query,
    action: Action.Read,  // our use-case, we just read it, so action = Action.Read
    authZToken: AuthZToken,
}

export type SolidAuthZRequestMessage = {
    authNToken: AuthNToken, // Subject
    action: Action,         // Action
    query: Query,           // Resource
    purpose?: Purpose[],       // Purpose: 
    agreement?: Agreement, // Agreement: Solidlib signes the obligation request of AuthZInterface
}

export type AuthZInterfaceResponse = {
    result: boolean,                        // Yes or No
    authZToken?: AuthZToken,                // Yes and, ALWAYS THERE WHEN YES
    preObligation?: PreObligationRequest    // No but, MAY BE HERE WHEN NO
}

export type PolicyRequestMessage = {
    policy: Policy
    action: Action.Write                          // our use-case, we just add it, so action = Action.Write
    authZToken: AuthZToken
}

