# Vienna hackathon

## Requirements for running

* Installing the library
* Creating a `.env` file
* Using node version 20 (or higher)

### Installing
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

- [ ] auditFlow: have log inteface so that end user can check agreements to start an audit
  - [ ] audit interface
  - [ ] solidlib: getAgreements
  - [ ] getData: at end store agreements on disk
- [ ] Small policy checking at authz
  - [ ] breaking: getData flow will not work stand-alone then
- [ ] cleanData method
  - [ ] clears stored agreements
  - [ ] clears stored policies
- [ ] Integrate auditflow in runAppFlow.ts