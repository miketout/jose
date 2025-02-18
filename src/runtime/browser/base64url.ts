import { encoder, decoder } from '../../lib/buffer_utils.js'

export const encodeBase64 = (input: Uint8Array | string) => {
  let unencoded = input
  if (typeof unencoded === 'string') {
    unencoded = encoder.encode(unencoded)
  }
  const CHUNK_SIZE = 0x8000
  const arr = []
  for (let i = 0; i < unencoded.length; i += CHUNK_SIZE) {
    // @ts-expect-error
    arr.push(String.fromCharCode.apply(null, unencoded.subarray(i, i + CHUNK_SIZE)))
  }
  return btoa(arr.join(''))
}

export const encode = (input: Uint8Array | string) => {
  return encodeBase64(input).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

export const decodeBase64 = (encoded: string): Uint8Array => {
  return new Uint8Array(
    atob(encoded)
      .split('')
      .map((c) => c.charCodeAt(0)),
  )
}

export const decode = (input: Uint8Array | string) => {
  let encoded = input
  if (encoded instanceof Uint8Array) {
    encoded = decoder.decode(encoded)
  }
  encoded = encoded.replace(/-/g, '+').replace(/_/g, '/').replace(/\s/g, '')
  try {
    return decodeBase64(encoded)
  } catch {
    throw new TypeError('The input to be decoded is not correctly encoded.')
  }
}
