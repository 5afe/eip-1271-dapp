import { hexlify, toUtf8Bytes } from 'ethers/lib/utils'
import { useState } from 'react'
import type { ReactElement } from 'react'

import useWalletConnect from '@/hooks/useWalletConnect'
import { generateSafeMessageTypedData, hashTypedData } from '@/utils/safe-messages'

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

const App = (): ReactElement => {
  const connector = useWalletConnect()

  const [account, setAccount] = useState('')
  const [isOffChain, setIsOffChain] = useState(false)
  const [message, setMessage] = useState('')

  const safeMessage = generateSafeMessageTypedData(connector.chainId, account, message)

  const safeMessageHash = hashTypedData(safeMessage)

  const onMessage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(event.target.value)
  }

  const onConnect = async () => {
    try {
      const { accounts } = await connector.connect()
      setAccount(accounts[0])
    } catch {
      setAccount('')
    }
  }

  const onDisconnect = async () => {
    try {
      await connector.killSession()
    } finally {
      setAccount('')
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
    const hexMessage = hexlify(toUtf8Bytes(message))

    connector.signMessage([account, hexMessage])
  }

  const onSignTypedData = async () => {
    const typedData = getExampleTypedData(connector.chainId, account, message)

    connector.signTypedData([account, JSON.stringify(typedData)])
  }

  return (
    <>
      <button onClick={account ? onDisconnect : onConnect}>{account ? 'Disconnect' : 'Connect'}</button> {account}
      <br />
      <br />
      <button onClick={onToggleOffChain} disabled={!account}>
        {isOffChain ? 'Disable' : 'Enable'} off-chain signing
      </button>
      <input onChange={onMessage} placeholder="Message" />
      <button onClick={onSign} disabled={!account}>
        Sign
      </button>
      <button onClick={onSignTypedData} disabled={!account}>
        Sign typed
      </button>
      <pre>SafeMessage: {JSON.stringify(safeMessage, null, 2)}</pre>
      <pre>messageHash: {JSON.stringify(safeMessageHash, null, 2)}</pre>
    </>
  )
}

export default App
