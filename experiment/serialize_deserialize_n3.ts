import { write } from '@jeswr/pretty-turtle';
import * as n3 from "n3"



let package = 
`@prefix dcterms: <http://purl.org/dc/terms/>.
@prefix odrl: <http://www.w3.org/ns/odrl/2/>.
@prefix pack: <https://example.org/ns/package#>.
@prefix policy: <https://example.org/ns/policy#>.
@prefix sign: <https://example.org/ns/signature#>.
@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.
[] pack:packages {
  [] pack:content {
      [] pack:packages {
        [] pack:content {
            <http://localhost:3123/dexa/id> <https://www.w3.org/2006/vcard/ns#bday> "2000-01-01T09:00:00.000Z"^^<http://www.w3.org/2001/XMLSchema#dateTime>.
          };
          pack:packagedAt "2023-11-28T14:47:17.556Z"^^xsd:dateTime;
          sign:hasContentSignature [
            a sign:Signature;
            sign:issuer <http://localhost:3456/flandersgov/id>;
            sign:created "2023-11-28T14:47:17.556Z"^^xsd:dateTime;
            sign:proofValue: "1XMhOYkm750vfCy1Huvn4M2GWhU8VBD2bolvYEHyNjXoHJsB283bRp4uAPY9NGBY9w28MGZ2iuJNSDr4WFdREr/xSacCZ2Ne2QliHpepJIRQtW9jM+Mghg+OlfNyHw2M";
          ].
      }.
    };
    pack:packagedBy <http://localhost:3123/dexa/id>;
    pack:packagedFrom <http://localhost:3123/dexa/endpoint>;
    pack:packagedAt "2023-11-28T14:47:17.563Z"^^xsd:dateTime;
    policy:hasContentPolicy [
      dcterms:creator <http://localhost:3123/dexa/id> ;
      dcterms:description "Data Usage Policy" ;
      dcterms:issued "2023-11-28T14:47:17.563Z"^^xsd:dateTime ;
      odrl:permission [
        odrl:action odrl:use ;
        odrl:constraint [
          odrl:leftOperand <https://w3id.org/oac#Purpose> ;
          odrl:operator odrl:eq ;
          odrl:rightOperand <https://gdpr.org/purposes/Research> ;
        ];

      ];
    ].
}.
`

let quads = new n3.Parser()
// Convert RDF/JS quads into a pretty turtle string
const str = await write(quads);