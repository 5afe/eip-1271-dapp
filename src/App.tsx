import { hashMessage, hexlify, toUtf8Bytes } from 'ethers/lib/utils'
import { useState } from 'react'
import type { ReactElement } from 'react'

import { useWalletConnect } from '@/hooks/useWalletConnect'
import { fetchSafeMessage } from '@/utils/safe-messages'
import { getSafeMessageHash, getThreshold, isValidSignature } from '@/utils/safe-interface'
import { getExampleTypedData, hashTypedData } from '@/utils/web3'
import { EIP191 } from '@/components/EIP191'
import { EIP712 } from '@/components/EIP712'

export const App = (): ReactElement => {
  const connector = useWalletConnect()
  const [safeAddress, setSafeAddress] = useState(connector.accounts[0])

  const [isSigningOffChain, setIsSigningOffChain] = useState(false)

  const [message, setMessage] = useState('')
  const [messageHash, setMessageHash] = useState('')

  const onConnect = async () => {
    let account = ''

    try {
      const { accounts } = await connector.connect()
      account = accounts[0]
    } catch (e) {
      console.error(e)
    }

    setSafeAddress(account)
  }

  const onDisconnect = async () => {
    try {
      await connector.killSession()
    } finally {
      setSafeAddress('')
      setIsSigningOffChain(false)
      setMessage('')
      setMessageHash('')
    }
  }

  const onToggleOffChain = async () => {
    const offChainSigning = !isSigningOffChain

    try {
      await connector.sendCustomRequest({
        method: 'safe_setSettings',
        params: [{ offChainSigning }],
      })
    } catch (e) {
      console.error(e)
    }

    setIsSigningOffChain(offChainSigning)
  }

  const onChangeMessage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(event.target.value)
  }

  const onChangeMessageHash = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMessageHash(event.target.value)
  }

  const onSign = async () => {
    let messageHash = ''

    try {
      const hexMessage = hexlify(toUtf8Bytes(message))

      await connector.signMessage([safeAddress, hexMessage])

      messageHash = hashMessage(message)
    } catch (e) {
      console.error(e)
    }

    setMessageHash(messageHash)
  }

  const onSignTypedData = async () => {
    let messageHash = ''

    const typedData = getExampleTypedData(connector.chainId, safeAddress, message)

    try {
      await connector.signTypedData([safeAddress, JSON.stringify(typedData)])

      messageHash = hashTypedData(typedData)
    } catch (e) {
      console.error(e)
    }

    setMessageHash(messageHash)
  }

  const onVerify = async () => {
    const safeMessageHash = await getSafeMessageHash(connector, safeAddress, messageHash)

    if (!safeMessageHash) {
      alert('Error getting SafeMessage hash from contract.')
      return
    }
    console.log('SafeMessage hash:', safeMessageHash)

    const safeMessage = await fetchSafeMessage(safeMessageHash)

    if (!safeMessage) {
      alert('Unable to fetch SafeMessage.')
      return
    }
    console.log('SafeMessage:', safeMessage)

    const threshold = await getThreshold(connector, safeAddress)

    if (!threshold || threshold > safeMessage.confirmations.length) {
      alert('Threshold has not been met.')
      return
    }

    const isValid = await isValidSignature(connector, safeAddress, messageHash, safeMessage.preparedSignature)

    alert(`Signature is ${isValid ? 'valid' : 'invalid'}.`)
  }

  return (
    <main style={{ display: 'grid', padding: '1em', gap: '1em', gridTemplateColumns: '1fr 1fr' }}>
      <div>
        <button onClick={safeAddress ? onDisconnect : onConnect}>{safeAddress ? 'Disconnect' : 'Connect'}</button>

        {safeAddress && (
          <>
            <button onClick={onToggleOffChain} disabled={!safeAddress}>
              {isSigningOffChain ? 'Disable' : 'Enable'} off-chain signing
            </button>

            <span>Safe address: {safeAddress}</span>

            <div>
              <label htmlFor="message">Message</label>
              <input name="message" value={message} onChange={onChangeMessage} style={{ width: '100%' }} />
              <button onClick={onSign} disabled={!safeAddress || !message}>
                Sign
              </button>
              <button onClick={onSignTypedData} disabled={!safeAddress || !message}>
                Sign in example typed data
              </button>
            </div>

            <div>
              <label htmlFor="hash">Message hash</label>
              <input name="hash" value={messageHash} onChange={onChangeMessageHash} style={{ width: '100%' }} />
              <button onClick={onVerify} disabled={!safeAddress || !messageHash}>
                Verify signature
              </button>
            </div>
          </>
        )}
      </div>
      {safeAddress && message && (
        <div>
          <EIP191 chainId={connector.chainId} safeAddress={safeAddress} message={message} />
          <EIP712 chainId={connector.chainId} safeAddress={safeAddress} message={message} />
        </div>
      )}
    </main>
  )
}
