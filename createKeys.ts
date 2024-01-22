import { webcrypto } from 'crypto';
import { appendFileSync, readFileSync } from "fs"


export async function createKeyPairFiles(publicPath: string, privatePath: string) {
  return nistP384(publicPath, privatePath)
}

const nistP384 = async (publicPath: string, privatePath: string) => {
  const keyPair = await webcrypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-384' },
    true,
    ['sign', 'verify']
  );

  const rawPublic = await webcrypto.subtle.exportKey('raw', keyPair.publicKey);
  appendFileSync(publicPath, Buffer.from(rawPublic));


  const rawPrivate = await webcrypto.subtle.exportKey('pkcs8', keyPair.privateKey);
  appendFileSync(privatePath, Buffer.from(rawPrivate));

  return keyPair
};

export async function importPublicKey(path: string) {
  const readKey = readFileSync(path)
  const imported = await webcrypto.subtle.importKey(
    'raw',
    readKey,
    { name: 'ECDSA', namedCurve: 'P-384' },
    true,
    ['verify']
  );
  return imported
}

export async function importPrivateKey(path: string) {
  const readKey = readFileSync(path)
  const imported = await webcrypto.subtle.importKey(
    'pkcs8',
    readKey,
    { name: 'ECDSA', namedCurve: 'P-384' },
    true,
    ['sign']
  );
  return imported
}
