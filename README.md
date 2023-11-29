# Vienna hackathon


## Installing everything
```
cd packaging
npm install

cd ../poddatainterface
npm install

cd ../services
npm install

cd ../asserting
npm install

cd ..
```

## Running the services that provide some data
```
cd services
bash run
```
This will startup the services, and show you their respective endpoints

you can test their responses by querying the services e.g.
```
curl http://localhost:3456/flandersgov/endpoint/dob?id=http://localhost:8040/bob/id
```

## Running the "POD" API
```
cd poddatainterface
ts-node api.ts bob
```
This will startup the pod data interface (you can choose the name at the end)
This automatically pulls in the data from the services above

## Making a request

Example request for getting the birthdate 
```
curl http://localhost:8040/bob/endpoint -H "Content-Type: text/n3" -X POST --data '?a <https://www.w3.org/2006/vcard/ns#bday> ?c.'

```

Example request for getting all data
```
curl http://localhost:8040/bob/endpoint -H "Content-Type: text/n3" -X POST --data '?a ?b ?c.'
```


