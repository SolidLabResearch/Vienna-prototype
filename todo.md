# Capabilities


## WebID
* Unique ID
* Authentication ?
* Discovery of Authorization Server


## Authorization Server
* Authentication ? - Credential negotiation
* Claim requests forwarden via Identifier info
* Policy management en execution
* Instantiation en claim retrieval van policies
* Agreement signing protocol
* Token return met Request en Location en Method en Body enzo


## Resource Server
* Token validaten
* Resource signing and packaging





# Backlog


* Handling keys and public information on the WebID

* resolve the IDP issue, the problem is the WebID how do we get information in there 
  * we should make a WebID in the prototype pod, and prove it with an external IDP, and then put that relation in the data graph of the pod kinda

* We have the problem of packaging creating tied-together data graphs
  * I still need to look into VCquery with partial representations
  * This could tie in with the notion of shapes though

* The policy side needs to be fully built still
  
* The exchange of agreements happens in JSON, but should be fully converted to RDF still
  * if this has happened, we can do the signatures without placeholder
  
* The store Website needs to come alive 
  
* We need to toggle authorization still 
  
* Does this solve the issues that we see though?
  * What about client side encryption
  * What about partial data/package access
  
* I am still not really a fan of the Admin - User separation
  
* Admin app adding extra policy
  
* Policy conflict resolution
  
* Attaching Usage control
  


---------------------------

* We want to enable automated data exchange
  * We use the simplest example of stores and 18+\

* We want provenanced and signed data

* Lookups in negotiation

* Data storage - maybe we need to approach it in a different way for now

* Policy system
  * Make instantiation concrete
  * Black box the policy box
  * This one returns a proposal

* Adding policy not important atm

* Skip first data request, go directly to auth server

* Jirafy


________________________________

# Message Example

GET http://endpoint.org/?interface=TPF&subject=<WebID>&predicate=vcard:bday



<!-- 

## Out of bounds info

WebID, OIDCIssuer, client

## MessageId can be e.g. a URN, skolem IRI, ...

@prefix fn: <http://www.w3.org/2006/xpath-functions#>.
@prefix crypto: <http://www.w3.org/2000/10/swap/crypto#>.
@prefix graph: <http://www.w3.org/2000/10/swap/graph#>.
@prefix log: <http://www.w3.org/2000/10/swap/log#> .
@prefix time: <http://www.w3.org/2000/10/swap/time#> .
@prefix func: <http://www.w3.org/2007/rif-builtin-function#>.
@prefix math: <http://www.w3.org/2000/10/swap/math#>.

<messageDocument> dialog:hasVerifiedContext {
  <messageId> dialog:senderClient <client>.
  <messageId> dialog:senderId <WebID>.
  <WebID> dialog:issuedBy <OIDCIssuer>.
}.

<messageDocument> dialog:hasBody {
  
  # start incoming message


  # message request

  <messageId> dialog:query {
    <WebID> dialog:trusts {
      ?person vcard:bday ?bday;
    }
  }

  # Mapping rules 

  ## Define trust relation

  { <WebID> dialog:trusts ?something }
  <=
  { 
    ?package pack:hasContentSignature ?signature.
    ?signature sign:issuer ?issuer.
    ?issuer list:isPartOf ( <instance1> <instance2> <instance3> ). 
    ?package pack:contains ?something.  
  }

  { ?package pack:contains ?something } 
  <=
  { ?package log:includes ?something }

  { ?package pack:contains ?something } 
  <=
  { 
    ?package pack:content ?content.
    ?content log:includes {
      ?bn pack:package ?childPackage.
    }.
    ?childPackage
  } -->

    
<!-- 
[] <https://example.org/ns/package#package> {
    [] <https://example.org/ns/package#content> {
        <test.xd> <https://www.w3.org/2006/vcard/ns#bday> "2000-01-01T09:00:00.000Z"^^<http://www.w3.org/2001/XMLSchema#dateTime> .

        
      } ;
  }

  { 
    ?package pack:content ?content.
    ?content log:includes {
      ?person :isAdult ?adult.      
    }
  }
  => 
  { <WebID> dialog:trusts ?statement. } 

  ## Do age calculation

  { 
    ?person <https://www.w3.org/2006/vcard/ns#bday> ?bdate.

    [] time:localTime _:LocalTime.

    (_:LocalTime "P18Y0M"^^xsd:yearMonthDuration) func:subtract-yearMonthDuration-from-dateTime ?requiredAge.
    
    ?bdate math:lessThan ?requiredAge.     

  } => { 
    ?person :isAdult ?adult.  
  }  

  # end incoming message





  



# Future Ideas

## Message
#### MessageId can be e.g. a URN, skolem IRI, ...

<messageDocument> dialog:hasVerifiedContext {
  <messageId> dialog:senderClient <client>.
  <messageId> dialog:senderId <WebID>.
  <WebID> dialog:issuedBy <OIDCIssuer>.
}.

<messageDocument> dialog:hasBody {
  
  # start incoming message

  @prefix fn: <http://www.w3.org/2006/xpath-functions#>.
  @prefix crypto: <http://www.w3.org/2000/10/swap/crypto#>.
  @prefix graph: <http://www.w3.org/2000/10/swap/graph#>.
  @prefix log: <http://www.w3.org/2000/10/swap/log#> .
  @prefix time: <http://www.w3.org/2000/10/swap/time#> .
  @prefix func: <http://www.w3.org/2007/rif-builtin-function#>.
  @prefix math: <http://www.w3.org/2000/10/swap/math#>.

  # message request

  <messageId> dialog:query {
    <WebID> dialog:trusts {
      ?person :isAdult ?adult;
    }
  }

  # Mapping rules 

  ## Define trust relation

  { 
    ?package pack:content ?content.
    ?content log:includes {
      ?person :isAdult ?adult.      
    }

    ?package pack:hasContentSignature ?signature.
    ?signature sign:issuer ?issuer
    ?issuer list:isPartOf ( <instance1> <instance2> <instance3> ).
  }
  => 
  { <WebID> dialog:trusts ?statement. } 

  ## Do age calculation

  { 
    ?person <https://www.w3.org/2006/vcard/ns#bday> ?bdate.

    [] time:localTime _:LocalTime.

    (_:LocalTime "P18Y0M"^^xsd:yearMonthDuration) func:subtract-yearMonthDuration-from-dateTime ?requiredAge.
    
    ?bdate math:lessThan ?requiredAge.     

  } => { 
    ?person :isAdult ?adult.  
  }  

  # end incoming message
}.





________________________________

# Policy Example


<!-- 
    _:Graffiti dialog:onVerifiedSurface _:G.
    _:G log:includes {
        _:Message a dialog:DialogMessage.
        _:Message dialog:actor _:Actor.
    }.
    _:Actor vcard:bday _:BirthDate.

    # Check if the actor was born before 18 years ago

    (
        { _:BirthDate math:lessThan _:DateToCheck. }
        { 
            _:AssertedGraph log:equalTo { _:Actor a rulelogic:Adult. }.
        }
        { 
            _:AssertedGraph log:equalTo {
                () log:onWarningSurface {
                    _:Warning a dialog:Warning;
                        dialog:message "Actor is a minor. No alcoholic beverages will be displayed".
                    # This does not warrant an additional question. We have sufficient information to decide we should not show alcoholic beverages
                }.
            }.
        }
    ) log:ifThenElseIn _:SCOPE . -->

<!-- 
[] <https://example.org/ns/package#package> {
    [] <https://example.org/ns/package#content> {
        <test.xd> <https://www.w3.org/2006/vcard/ns#bday> "2000-01-01T09:00:00.000Z"^^<http://www.w3.org/2001/XMLSchema#dateTime> .

        
      } ;
      <https://example.org/ns/package#origin> <http://localhost:3456/flandersgov/endpoint/dob> ;
      <https://example.org/ns/package#createdAt> "2024-01-08T17:08:52.165Z"^^<http://www.w3.org/2001/XMLSchema#dateTime> ;
      <https://example.org/ns/package#hasContentSignature> [
        a <https://example.org/ns/signature#Signature> ;
        <https://example.org/ns/signature#issuer> <http://localhost:3456/flandersgov/id> ;
        <https://example.org/ns/signature#created> "2024-01-08T17:08:52.166Z"^^<http://www.w3.org/2001/XMLSchema#dateTime> ;
        <https://example.org/ns/signature#proofValue> "sSJ0xHT7yH2MeYjI6I7fVy+PRfh/EDJkTEOhbCA2BYcd+GBJRD1BQV1rwVe69cNPHhtvGKbITIf7TBlbpkE6YANMNNS2aSQMw8i6TLTXa16zhukp+V1nLYKE/51rt/Us"
      ] .
    
  } .
[dexa@dexa-worklaptop Vienna2023]$  -->