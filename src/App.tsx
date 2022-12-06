import { hashMessage, hexlify, toUtf8Bytes } from 'ethers/lib/utils'
import { useEffect, useMemo, useState } from 'react'
import type { ReactElement } from 'react'

import useWalletConnect from '@/hooks/useWalletConnect'
import { fetchSafeMessage, generateSafeMessage } from '@/utils/safe-messages'
import { getMessageHashForSafe, getThreshold, isValidSignature } from '@/utils/safe-interface'
import { getExampleTypedData, hashTypedData } from '@/utils/web3'

const App = (): ReactElement => {
  const connector = useWalletConnect()
  const [isSigningOffChain, setIsSigningOffChain] = useState(false)

  const [safeAddress, setSafeAddress] = useState<string>(connector.accounts[0])

  const [message, setMessage] = useState('')
  const [messageHash, setMessageHash] = useState('')

  const safeMessage = useMemo(() => {
    return generateSafeMessage(connector.chainId, safeAddress, message)
  }, [message])
  const safeMessageHash = useMemo(() => {
    return safeMessage ? hashTypedData(safeMessage) : undefined
  }, [safeMessage])

  const onMessage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMessageHash('')
    setMessage(event.target.value)
  }

  const onConnect = async () => {
    let account: string | undefined

    try {
      const { accounts } = await connector.connect()
      account = accounts[0]
    } catch {
      return
    }

    setSafeAddress(account)
  }

  const onDisconnect = async () => {
    try {
      await connector.killSession()
    } finally {
      setSafeAddress('')
    }
  }

  const onToggleOffChain = async () => {
    const offChainSigning = !isSigningOffChain

    try {
      await connector.sendCustomRequest({
        method: 'safe_setSettings',
        params: [{ offChainSigning }],
      })

      setIsSigningOffChain(offChainSigning)
    } catch {
      // Ignore
    }
  }

  const onSign = async () => {
    setMessageHash('')

    try {
      const hexMessage = hexlify(toUtf8Bytes(message))

      await connector.signMessage([safeAddress, hexMessage])

      const hash = hashMessage(message)
      setMessageHash(hash)
    } catch {
      // Ignore
    }
  }

  const onSignTypedData = async () => {
    setMessageHash('')

    const typedData = getExampleTypedData(connector.chainId, safeAddress, message)

    try {
      await connector.signTypedData([safeAddress, JSON.stringify(typedData)])

      const hash = hashTypedData(typedData)
      setMessageHash(hash)
    } catch {
      // Ignore
    }
  }

  const onVerify = async () => {
    const safeMessageHash = await getMessageHashForSafe(connector, safeAddress, messageHash)
    if (!safeMessageHash) {
      console.error('Error getting SafeMessage hash from contract.')
      return
    }
    console.log('SafeMessage hash:', safeMessageHash)

    const safeMessage = await fetchSafeMessage(safeMessageHash)
    if (!safeMessage) {
      console.error('Unable to fetch SafeMessage.')
      return
    }
    console.log('SafeMessage:', safeMessage)

    const threshold = await getThreshold(connector, safeAddress)
    if (!threshold || threshold > safeMessage.confirmations.length) {
      console.error('Threshold has not been met.')
      return
    }

    const isValid = await isValidSignature(connector, safeAddress, messageHash, safeMessage.preparedSignature)

    alert(`Signature is ${isValid ? 'valid' : 'invalid'}.`)
  }

  return (
    <>
      <button onClick={safeAddress ? onDisconnect : onConnect}>{safeAddress ? 'Disconnect' : 'Connect'}</button>
      {safeAddress ? ` Safe address: ${safeAddress}` : ''}
      <br />
      <br />
      <button onClick={onToggleOffChain} disabled={!safeAddress}>
        {isSigningOffChain ? 'Disable' : 'Enable'} off-chain signing
      </button>
      <input onChange={onMessage} placeholder="Message" />
      <button onClick={onSign} disabled={!safeAddress || !message}>
        Sign
      </button>
      <button onClick={onSignTypedData} disabled={!safeAddress || !message}>
        Sign in example typed data
      </button>
      <button onClick={onVerify} disabled={!safeAddress || !messageHash}>
        Verify signature
      </button>
      <pre>SafeMessage: {JSON.stringify(safeMessage, null, 2)}</pre>
      <pre>SafeMessage hash: {JSON.stringify(safeMessageHash, null, 2)}</pre>
    </>
  )
}

export default App
