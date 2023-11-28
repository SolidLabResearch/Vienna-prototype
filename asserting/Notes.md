Declare algorithms understood by having rule slike

{
  :proof
    :proofValue ?X ;
    :signatureMechanism "EDSA" ;
    :proofFor :data .

  # Do we want a built in to express checking a proof?
} => {
  :data is :true
}
