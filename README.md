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
* getData: We can retrieve the birthdate using the app flow.
* getDataWithTrust: We can retrieve all trusted data using the trusted data app flow.
* addPolicy: Adding a policy to the pod
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
ts-node runAppFlow.ts
```

We can retrieve all trusted data using the trusted data app flow.
```
ts-node runAppFlowAll.ts
```

## Running the AddPolicy flow
```
ts-node runAddPolicyFlow.ts
```