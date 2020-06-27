
'use strict'

const IdentityProvider = require('orbit-db-identity-provider/src/identity-provider-interface')
const Keystore = require('orbit-db-keystore')
const type = 'odbipd'

class OrbitDBIdentityProviderD extends IdentityProvider {
  constructor ({ keystore }) {
    super()
    if (!keystore) {
      throw new Error('OrbitDBIdentityProviderD requires a keystore')
    }
    this._keystore = keystore
  }

  // Returns the type of the identity provider
  static get type () { return type }

  async getId (options = {}) {
    const id = options.id
    if (!id) {
      throw new Error('id is required')
    }
    if (typeof options.derive === 'string') {
      if (typeof this._keystore.deriveKey !== 'function') {
        throw new Error('keystore does not support key derivation')
      }
      const key = await this._keystore.deriveKey(id, options.derive)
      return key.public.marshal().toString('hex')
    }

    const keystore = this._keystore
    const key = await keystore.getKey(id) || await keystore.createKey(id)
    return key.public.marshal().toString('hex')
  }

  async signIdentity (data, options = {}) {
    const id = options.id
    if (!id) {
      throw new Error('id is required')
    }
    const keystore = this._keystore
    const key = await keystore.getKey(id)
    if (!key) {
      throw new Error(`Signing key for '${id}' not found`)
    }

    return keystore.sign(key, data)
  }

  static async verifyIdentity (identity) {
    // Verify that identity was signed by the ID
    return Keystore.verify(
      identity.signatures.publicKey,
      identity.id,
      identity.publicKey + identity.signatures.id
    )
  }
}

module.exports = OrbitDBIdentityProviderD
