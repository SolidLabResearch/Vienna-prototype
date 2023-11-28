In this demo, the :assertedBy is generated in 2 ways.

1. Getting packaged data sent to you with an authenticated request. The authenticated request includes data which
can be brought into the top level scope (e.g. the token). And then the authenticated + a rule that says that type
of authentication is sufficient => the data is authenticatedBy X.

2. Having nested packaged statements with signatures.

This generally comes down to "some form of authentication" + "rule stating that form of authentication is sufficient" => "X asserted that statement".

statement + autentication = assertedBy
assertedBy + trusted = fact


