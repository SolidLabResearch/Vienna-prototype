import { IDPServer } from "./setup";

export async function linkAccountWithWebID(IDPServerURI: string, options: { webId: string, password: string, email: string} ) {
    IDPServerURI = IDPServerURI.endsWith('/') ? IDPServerURI : IDPServerURI+"/"

    let IDPOptions = await (await fetch(`${IDPServerURI}.account/`, { 
        headers: {
            "Accept": "application/json"
        }
    })).json();

    // console.log(IDPOptions)

    // Create account
    let accountCreationInfo = await (await fetch(IDPOptions.controls.account.create, {
        method: "POST",
    })).json()
    // console.log(accountCreationInfo)

    const authorizationCode = accountCreationInfo.authorization;

    let authorizedAccountInfo = await (await fetch(IDPOptions.controls.main.index, { 
        headers: {
            "Accept": "application/json",
            "Authorization": `CSS-Account-Token ${authorizationCode}`
        }
    })).json();

    // console.log(authorizedAccountInfo)

    let createPassword = await (await fetch(authorizedAccountInfo.controls.password.create,{
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `CSS-Account-Token ${authorizationCode}`
        },
        body: JSON.stringify({
            "email": options.email,
            "password": options.password
        })
    })).json()

    // console.log(createPassword)

    let linkWebID = await (await fetch(authorizedAccountInfo.controls.account.webId,{
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `CSS-Account-Token ${authorizationCode}`
        },
        body: JSON.stringify({ webId: options.webId })
    })).json()

    // console.log(linkWebID)

    

}

