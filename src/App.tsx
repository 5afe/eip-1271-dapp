import { isAddress } from 'ethers/lib/utils'
import { useMemo, useState } from 'react'
import type { ReactElement } from 'react'

import useWalletConnect from '@/hooks/useWalletConnect'
import { generateSafeMessageTypes, hashTypedData } from '@/utils/safe-messages'
import { ethers } from 'ethers'

const App = (): ReactElement => {
  const [form, setForm] = useState({
    safeAddress: '',
    message: '',
  })

  const onInput = (name: keyof typeof form) => {
    return (event: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prevForm) => ({ ...prevForm, [name]: event.target.value }))
    }
  }

  const connector = useWalletConnect()

  const assertConnected = async () => {
    if (!connector.connected) {
      connector.createSession()
    }
  }

  const [isOffChain, setIsOffChain] = useState(false)

  const onToggle = async () => {
    await assertConnected()

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
    await assertConnected()
    const messageAsHex = ethers.utils.hexlify(ethers.utils.toUtf8Bytes(form.message))
    const result = await connector.signMessage([form.safeAddress, messageAsHex])
    console.log('Sign result', result)
  }

  const onSignTypedData = async () => {
    await assertConnected()

    const typedData = {
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
        chainId: connector.chainId,
        verifyingContract: form.safeAddress,
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
        contents: form.message,
      },
    }

    connector.signTypedData([form.safeAddress, JSON.stringify(typedData)])
  }

  const message = useMemo(() => {
    if (!isAddress(form.safeAddress)) {
      return
    }

    try {
      return generateSafeMessageTypes(connector.chainId, form.safeAddress, form.message)
    } catch {}
  }, [connector.chainId, form.safeAddress, form.message])

  const messageHash = useMemo(() => {
    try {
      return hashTypedData(message)
    } catch {}
  }, [connector.chainId, form.safeAddress, form.message])

  return (
    <>
      <input onInput={onInput('safeAddress')} placeholder="Safe address" />
      <button onClick={onToggle}>{isOffChain ? 'Disable' : 'Enable'} off-chain signing</button>
      <br />
      <br />

      <input onChange={onInput('message')} placeholder="Message" />
      <button onClick={onSign}>Sign</button>
      <button onClick={onSignTypedData}>Sign typed</button>

      <pre>SafeMessage: {JSON.stringify(message, null, 2)}</pre>
      <pre>messageHash: {JSON.stringify(messageHash, null, 2)}</pre>
    </>
  )
}

export default App
