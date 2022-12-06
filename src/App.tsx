import { hashMessage, hexlify, Interface, toUtf8Bytes } from 'ethers/lib/utils'
import { useState } from 'react'
import type { ReactElement } from 'react'

import useWalletConnect from '@/hooks/useWalletConnect'
import { generateSafeMessageTypedData, hashTypedData } from '@/utils/safe-messages'
import { GOERLI_TX_SERVICE_STAGING_URL } from '@/config/constants'
import { flushSync } from 'react-dom'
import { BigNumber } from 'ethers'

type MessageResponse = {
  created: string
  modified: string
  messageHash: string
  message: string | unknown // TODO:
  proposedBy: string
  safeAppId: number | null
  confirmations: unknown[] // TODO:
  preparedSignature: string
}

const getExampleTypedData = (chainId: number, verifyingContract: string, contents: string) => {
  return {
    types: {
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' },
      ],
      Person: [
        { name: 'name', type: 'string' },
        { name: 'account', type: 'address' },
      ],
      Mail: [
        { name: 'from', type: 'Person' },
        { name: 'to', type: 'Person' },
        { name: 'contents', type: 'string' },
      ],
    },
    primaryType: 'Mail',
    domain: {
      name: 'EIP-1271 Example DApp',
      version: '1.0',
      chainId,
      verifyingContract,
    },
    message: {
      from: {
        name: 'Alice',
        account: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      },
      to: {
        name: 'Bob',
        account: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      },
      contents,
    },
  }
}

const SAFE_ABI = [
  'function isValidSignature(bytes calldata _data, bytes calldata _signature) public view returns (bytes4)',
  'function getMessageHashForSafe(address safe, bytes memory message) public view returns (bytes32)',
  'function getThreshold() public view returns (uint256)',
]
const safeSignerInterface = new Interface(SAFE_ABI)

const App = (): ReactElement => {
  const connector = useWalletConnect()

  const [safeAddress, setSafeAddress] = useState(connector.accounts[0] || '')
  const [threshold, setThreshold] = useState<number | undefined>()

  const [isOffChain, setIsOffChain] = useState(false)
  const [message, setMessage] = useState('')
  const [messageHash, setMessageHash] = useState('')
  const [verificationResult, setVerificationResult] = useState<string>('')

  const safeMessage = generateSafeMessageTypedData(connector.chainId, safeAddress, message)

  const safeMessageHash = hashTypedData(safeMessage)

  const onMessage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(event.target.value)
  }

  const onConnect = async () => {
    let account: string | undefined

    try {
      const { accounts } = await connector.connect()

      account = accounts[0]
    } catch {
      setSafeAddress('')
      return
    }

    let threshold: number | undefined

    try {
      const getThresholdData = safeSignerInterface.encodeFunctionData('getThreshold', [])

      const thresholdResponse: number = await connector.sendCustomRequest({
        method: 'eth_call',
        params: [{ to: account, data: getThresholdData }],
      })
      threshold = BigNumber.from(thresholdResponse).toNumber()
    } catch {}

    setSafeAddress(account)
    setThreshold(threshold)
  }

  const onVerify = async () => {
    const MAGIC_VALUE_BYTES = '0x20c13b0b'

    // Create Safe message hash
    const getMessageHashData = safeSignerInterface.encodeFunctionData('getMessageHashForSafe', [
      safeAddress,
      messageHash,
    ])

    try {
      const safeMessageHashResponse: string = await connector.sendCustomRequest({
        method: 'eth_call',
        params: [{ to: safeAddress, data: getMessageHashData }],
      })
      console.log('Safe Message hash from contract', safeMessageHashResponse)

      // TODO: fetch signature using safeMessageHash
      const { confirmations, preparedSignature } = await fetch(
        `${GOERLI_TX_SERVICE_STAGING_URL}/v1/messages/${safeMessageHashResponse}/`,
        {
          headers: { 'Content-Type': 'application/json' },
        },
      ).then((resp) => {
        if (!resp.ok) {
          return Promise.reject('Invalid response when fetching message')
        }
        return resp.json() as Promise<MessageResponse>
      })

      if (!threshold || confirmations.length < threshold) {
        setVerificationResult('Threshold not met.')
        return
      }

      console.log('Fetched signature: ', preparedSignature)

      // verify signature
      const verifySignatureData = safeSignerInterface.encodeFunctionData('isValidSignature', [
        messageHash,
        preparedSignature,
      ])

      const verifySignatureResponse: string = await connector.sendCustomRequest({
        method: 'eth_call',
        params: [{ to: safeAddress, data: verifySignatureData }],
      })

      const isValid = verifySignatureResponse.slice(0, 10).toLowerCase() === MAGIC_VALUE_BYTES

      setVerificationResult(isValid ? 'Message is signed' : 'Message signature is invalid')
    } catch (error) {
      console.error(error)
      setVerificationResult('Error while veriying')
    }
  }

  const onDisconnect = async () => {
    try {
      await connector.killSession()
    } finally {
      setSafeAddress('')
      setThreshold(undefined)
    }
  }

  const onToggleOffChain = async () => {
    const offChainSigning = !isOffChain

    connector.sendCustomRequest({
      id: 1337,
      jsonrpc: '2.0',
      method: 'safe_setSettings',
      params: [{ offChainSigning }],
    })

    setIsOffChain(offChainSigning)
  }

  const onSign = async () => {
    setMessageHash('')

    try {
      const hexMessage = hexlify(toUtf8Bytes(message))

      await connector.signMessage([safeAddress, hexMessage])
      setMessageHash(hashMessage(message))
    } catch {}
  }

  const onSignTypedData = async () => {
    setMessageHash('')

    const typedData = getExampleTypedData(connector.chainId, safeAddress, message)

    try {
      await connector.signTypedData([safeAddress, JSON.stringify(typedData)])
      setMessageHash(hashTypedData(typedData) || '')
    } catch {}
  }

  return (
    <>
      <button onClick={safeAddress ? onDisconnect : onConnect}>{safeAddress ? 'Disconnect' : 'Connect'}</button>{' '}
      {safeAddress}, threshold: {threshold}
      <br />
      <br />
      <button onClick={onToggleOffChain} disabled={!safeAddress}>
        {isOffChain ? 'Disable' : 'Enable'} off-chain signing
      </button>
      <input onChange={onMessage} placeholder="Message" />
      <button onClick={onSign} disabled={!safeAddress}>
        Sign
      </button>
      <button onClick={onSignTypedData} disabled={!safeAddress}>
        Sign typed
      </button>
      <button onClick={onVerify} disabled={!safeAddress || !messageHash}>
        Verify Signature
      </button>
      <pre>SafeMessage: {JSON.stringify(safeMessage, null, 2)}</pre>
      <pre>messageHash: {JSON.stringify(safeMessageHash, null, 2)}</pre>
      <pre>Is signature valid?: {verificationResult}</pre>
    </>
  )
}

export default App
