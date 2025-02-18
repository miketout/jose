import { Buffer } from 'buffer'
import { KeyObject, createDecipheriv, createCipheriv, createSecretKey } from 'crypto'
import { JOSENotSupported } from '../../util/errors.js'
import type { AesKwUnwrapFunction, AesKwWrapFunction } from '../interfaces.d'
import { concat } from '../../lib/buffer_utils.js'
import { isCryptoKey } from './webcrypto.js'
import { checkEncCryptoKey } from '../../lib/crypto_key.js'
import isKeyObject from './is_key_object.js'
import invalidKeyInput from '../../lib/invalid_key_input.js'
import supported from './ciphers.js'
import { types } from './is_key_like.js'

function checkKeySize(key: KeyObject, alg: string) {
  if (key.symmetricKeySize! << 3 !== parseInt(alg.substr(1, 3), 10)) {
    throw new TypeError(`Invalid key size for alg: ${alg}`)
  }
}

function ensureKeyObject(key: unknown, alg: string, usage: KeyUsage) {
  if (isKeyObject(key)) {
    return key
  }
  if (key instanceof Uint8Array) {
    return createSecretKey(key)
  }
  if (isCryptoKey(key)) {
    checkEncCryptoKey(key, alg, usage)
    return KeyObject.from(key)
  }

  throw new TypeError(invalidKeyInput(key, ...types, 'Uint8Array'))
}

export const wrap: AesKwWrapFunction = (alg: string, key: unknown, cek: Uint8Array) => {
  const size = parseInt(alg.substr(1, 3), 10)
  const algorithm = `aes${size}-wrap`
  if (!supported(algorithm)) {
    throw new JOSENotSupported(
      `alg ${alg} is not supported either by JOSE or your javascript runtime`,
    )
  }
  const keyObject = ensureKeyObject(key, alg, 'wrapKey')
  checkKeySize(keyObject, alg)
  const cipher = createCipheriv(algorithm, keyObject, Buffer.alloc(8, 0xa6))
  return concat(cipher.update(cek), cipher.final())
}

export const unwrap: AesKwUnwrapFunction = (
  alg: string,
  key: unknown,
  encryptedKey: Uint8Array,
) => {
  const size = parseInt(alg.substr(1, 3), 10)
  const algorithm = `aes${size}-wrap`
  if (!supported(algorithm)) {
    throw new JOSENotSupported(
      `alg ${alg} is not supported either by JOSE or your javascript runtime`,
    )
  }
  const keyObject = ensureKeyObject(key, alg, 'unwrapKey')
  checkKeySize(keyObject, alg)
  const cipher = createDecipheriv(algorithm, keyObject, Buffer.alloc(8, 0xa6))
  return concat(cipher.update(encryptedKey), cipher.final())
}
