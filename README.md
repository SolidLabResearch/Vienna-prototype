# Vienna hackathon

## Requirements for running

* Installing the library
* Creating a `.env` file
* Using node version 20 (or higher)


## UML sequence diagrams

Can be online visualised via [sequencediagram.org](https://sequencediagram.org/) or with the vscode extension [PlantUML](https://plantuml.com/).

### Owner set up a policy

![](../img/owner-set-up-policy.svg)

### Shop gets data (data not signed)

![](../img/shop-get-data-version-not-signing-data.svg)


## Installing
```sh
npm i

```
### Environment file

Create a .env resource with WebID, user email and password with a CSS (supporting client credentials):

```env
WEB_ID=""
USER_NAME=""
PASSWORD=""
```
### Node version

```sh
node -v
# v20.10.0
```
If node is not 20 and you are using nvm you can use following command to fix it
```
nvm install 20
nvm use 20
```

## Flows 

We have four different flows: 
* [getData](https://raw.githubusercontent.com/SolidLabResearch/Vienna-prototype/main/img/shop-get-data-version-not-signing-data.svg): We can retrieve the birthdate using the app flow.
* getDataWithTrust: We can retrieve all trusted data using the trusted data app flow.
* [addPolicy](https://raw.githubusercontent.com/SolidLabResearch/Vienna-prototype/main/img/owner-set-up-policy.svg): Adding a policy to the pod
* end-to-end: Adding a policy to the pod and then getting the birthdate using the app flow.

To run the end to end flow, you can use the following command 

```sh
npm start
```

If you want to just run the interfaces stand alone, you can use

```
npm run serve
```
## Running the app flow


We can retrieve the birthdate using the app flow.
```
ts-node runAppGetDataFlow.ts
```

We can retrieve all trusted data using the trusted data app flow.
```
ts-node runAppGetDataTrustFlow.ts
```

## Running the AddPolicy flow
```
ts-node runAddPolicyFlow.ts
```

## TODO's

- [ ] Create a lot of different flows (with deliberate ones throwing errors)
- [ ] Create a list of assumptions at points in the code (e.g. policy matching is string matching because of ...).
This could all be starting points of proper research
- [X] verify agreement


## Assumptions made

* Policy subject is not verified, it currently matches on a passed string value
  * Time constraints, and we have a working IDP eventually when porting to CSS
* Policy matching on the query string is done with string matching
  * We are unsure how exactly we should tackle this, so we use a for-now approach
* Signed data is stored as trusted packages of single triples
  * This is a limitation of the query approach we use, which requires a single triple request to be made.
  * On matching, this will retrieve the full package containing said triple, which will give problems if multiple triples are present in that package.


### Attendees

* Ruben D
* Wout Slabbinck
* Sabrina

### TODO list

- [X] remove README at SolidPod
- [ ] Describe what is the pod (solidPod directory) and Interface (SolidLib directory)
- [ ] Refactor job
  - [ ] Maybe split the calls for the SolidAware Lib (one lib with Add Policy and log entries; another with getData and getDatawithTrust)
    - [ ] We have a SolidAwareLib to plug in for stores
    - [ ] We have an admin
- [ ] Identity interface:
  - [ ] would be nice for it to be worked out
    - [ ] add endpoint urls and webid
- [ ] Agreement should be modelled as RDF (log + authz Interface and solidlib authz modelling)
- [ ] Logs should be queryable
  - [ ] But maybe use DataInterface for that -> there is a need for addData
- [ ] PolicyInterface
  - [ ] We only have adding a policy naively
    - [ ] no integrety constraints
- [ ] no way to store meta policies
- [ ] There is a need for proper triple stores for both DATA and Policies and Logs (or maybe just one? -> research question)
- [ ] AuthZInterface
  - [ ] Authorization token must be a proper flow; not the string hardcoded one
    - [ ] after creating the token | remove all the string tokens in data interfaces as well as they will use a check
  - [ ] checktype: differntiation between admin and normal shop (not between data type)
  - [ ] Proper policy matching is required (Ines would like to do this)
  - [ ] Important split into multiple files
  - [ ] add proper signature when signing instantiated policy (L160)
  - [ ] Verify agreement must check signatures
  - [ ] Companies need to be able to pass a public key (otherwise we can not check the signature of the agreement)
- [ ] Proper modelling of how to sign (alg+key in webid)
- [ ] DataInterface
  - [ ] Is the triple a good way to ask the request?
  - [ ] Add Data functionality
  - [ ] Maybe add documentation about why getting data is a POST or change it to a get (with urlencode)
  - [ ] Packaging: `packagedBy` must be the pod (not the webid, its not the person doing it. Its the pod on behalf of ...)
  - [ ] package needs a more specific name
  - [ ] put triple in package and sign make sense
    - [ ] but might be able to optimise
  - [ ] getData Component:
    - [ ] after RDF agremeent, add to the package (as it is part of the data -> it is a sticky policy if it were signed by the pod)
      - [ ] maybe add a pointer to where the source is for optimisation
- [ ] note: key management is horrible -> maybe use solid in a good wey there
- [ ] Add some extra documentation

- [ ] Sabrina: send ESWC functional encryption paper Ruben D
- [ ] Sabrina: Would be nice to have a policy and data generator to have a benchmark