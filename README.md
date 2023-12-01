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
