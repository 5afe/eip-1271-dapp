import { hashMessage, hexlify, toUtf8Bytes } from 'ethers/lib/utils'
import { useEffect, useMemo, useState } from 'react'
import type { ReactElement } from 'react'

import { useWalletConnect } from '@/hooks/useWalletConnect'
import { getSafeMessageHash, getThreshold, isValidSignature } from '@/utils/safe-interface'
import { getExampleTypedData, hashTypedData } from '@/utils/web3'
import { EIP191 } from '@/components/EIP191'
import { EIP712 } from '@/components/EIP712'
import { EIP5792 } from '@/components/EIP5792'
import { Web3Modal } from '@web3modal/standalone'
import { ethers } from 'ethers'

export const App = (): ReactElement => {
  const connector = useWalletConnect()
  const [topic, setTopic] = useState<string>()
  const [chainId, setChainId] = useState(5)
  const [rpcUrl, setRpcUrl] = useState<string>()
  const [safeAddress, setSafeAddress] = useState<string>()
  const [currentChainId, setCurrentChainId] = useState<number>()
  const [isSigningOffChain, setIsSigningOffChain] = useState(true)

  const [signature, setSignature] = useState<string>()

  const [message, setMessage] = useState('')
  const [messageHash, setMessageHash] = useState('')

  const INFURA_CHAINS = [1, 5, 137]

  const RPC_MAPPING: Record<number, string> = {
    [100]: 'https://rpc.gnosis.gateway.fm',
    [56]: 'https://bsc-dataseed.binance.org/',
    [42161]: 'https://arb1.arbitrum.io/rpc',
    [1313161554]: 'https://mainnet.aurora.dev',
    [43114]: 'https://api.avax.network/ext/bc/C/rpc',
  }

  const rpcProvider = useMemo(() => {
    if (!currentChainId) {
      return
    }
    const isInfura = import.meta.env.INFURA_KEY !== undefined && INFURA_CHAINS.includes(currentChainId)

    if (isInfura) {
      return new ethers.providers.InfuraProvider(currentChainId, import.meta.env.INFURA_KEY)
    }

    return new ethers.providers.JsonRpcProvider(rpcUrl)
  }, [currentChainId, rpcUrl])

  const web3Modal = useMemo(
    () =>
      new Web3Modal({
        projectId: import.meta.env.WC_PROJECT_ID,
        standaloneChains: [`eip155:${chainId}`],
      }),
    [chainId],
  )

  const onConnect = async () => {
    if (!connector) {
      return
    }

    try {
      const { uri, approval } = await connector.connect({
        requiredNamespaces: {
          eip155: {
            methods: [
              'eth_signTypedData',
              'eth_sign',
              'safe_setSettings',
              'wallet_sendFunctionCallBundle',
              'wallet_sendFunctionCallBundle',
              'wallet_getBundleStatus',
              'wallet_showBundleStatus',
            ],
            chains: [`eip155:${chainId}`],
            events: ['accountsChanged', 'chainChanged'],
          },
        },
      })

      connector.on('session_delete', onDisconnect)

      if (uri) {
        web3Modal.openModal({ uri })

        const session = await approval()
        setTopic(session.topic)
        const connectedAccount = session.namespaces.eip155.accounts[0]
        if (connectedAccount) {
          const [eip155, chainId, address] = connectedAccount.split(':')
          setCurrentChainId(Number(chainId))
          setSafeAddress(address)
        }
        web3Modal.closeModal()
      }
    } catch (e) {
      console.error(e)
    }
  }

  const onDisconnect = async () => {
    if (!connector || !topic) {
      return
    }
    try {
      // await connector?.disconnect({
      //   topic: topic,
      // })
    } finally {
      setSafeAddress('')
      setIsSigningOffChain(false)
      setMessage('')
      setMessageHash('')
    }
  }

  const onToggleOffChain = () => setIsSigningOffChain((prev) => !prev)

  const onChangeMessage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(event.target.value)
    setMessageHash('')
  }

  const onChangeChainId = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newChainId = Number(event.target.value)
    setChainId(newChainId)
    const newRpcUrl = RPC_MAPPING[newChainId]
    if (newRpcUrl) {
      setRpcUrl(newRpcUrl)
    }
  }

  const onChangeRpcUrl = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRpcUrl(event.target.value)
  }

  const onChangeMessageHash = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMessageHash(event.target.value)
  }

  const applyOffChainSigningSetting = async () => {
    if (!connector || !topic) {
      return
    }
    try {
      const result = (await connector.request({
        chainId: 'eip155:' + currentChainId,
        topic: topic,
        request: {
          method: 'safe_setSettings',
          params: [{ offChainSigning: isSigningOffChain }],
        },
      })) as { offChainSigning: boolean }

      console.log(result)

      if (result && result.offChainSigning !== isSigningOffChain) {
        throw new Error('Enabling off-chain signing did not work.')
      }
    } catch (e) {
      console.error(e)
      return false
    }
    return true
  }

  const onSign = async () => {
    if (!connector || !topic) {
      return
    }
    let messageHash = ''

    try {
      if (!(await applyOffChainSigningSetting())) {
        return
      }
      const hexMessage = hexlify(toUtf8Bytes(message))

      const signature = await connector.request<string>({
        chainId: 'eip155:' + currentChainId,
        topic: topic,
        request: {
          method: 'eth_sign',
          params: [safeAddress, hexMessage],
        },
      })

      setSignature(signature)

      messageHash = hashMessage(message)
    } catch (e) {
      console.error(e)
    }

    setMessageHash(messageHash)
  }

  const onSignTypedData = async () => {
    if (!connector || !topic || !safeAddress || !currentChainId) {
      return
    }
    let messageHash = ''

    const typedData = getExampleTypedData(currentChainId, safeAddress, message)

    try {
      if (!(await applyOffChainSigningSetting())) {
        return
      }

      const signature = await connector.request<string>({
        chainId: 'eip155:' + currentChainId,
        topic: topic,
        request: {
          method: 'eth_signTypedData',
          params: [safeAddress, JSON.stringify(typedData)],
        },
      })

      setSignature(signature)

      messageHash = hashTypedData(typedData)
    } catch (e) {
      console.error(e)
    }

    setMessageHash(messageHash)
  }

  const onBundleRequest = async (request: { method: string; params: any[] }): Promise<string | null> => {
    if (!connector || !topic || !safeAddress || !currentChainId) {
      return null
    }

    return await connector.request({
      chainId: 'eip155:' + currentChainId,
      topic: topic,
      request,
    })
  }

  const onVerify = async () => {
    if (!connector || !safeAddress || !topic || !currentChainId || !rpcProvider || !signature) {
      return
    }
    const safeMessageHash = await getSafeMessageHash(rpcProvider, safeAddress, messageHash)

    if (!safeMessageHash) {
      alert('Error getting SafeMessage hash from contract.')
      return
    }
    console.log('SafeMessage hash:', safeMessageHash)

    const isValid = await isValidSignature(rpcProvider, safeAddress, messageHash, signature)

    alert(`Signature is ${isValid ? 'valid' : 'invalid'}.`)
  }

  return (
    <main style={{ display: 'grid', padding: '1em', gap: '1em', gridTemplateColumns: '1fr 1fr' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label htmlFor="chainId">Chain ID</label>
        <input name="chainId" type="number" value={chainId} onChange={onChangeChainId} />
        <label htmlFor="rpcUrl">RPC URL</label>
        <input name="rpcUrl" value={rpcUrl} onChange={onChangeRpcUrl} />
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
              <label htmlFor="hash">Message hash (SafeMessage)</label>
              <input name="hash" value={messageHash} onChange={onChangeMessageHash} style={{ width: '100%' }} />

              {signature !== undefined && (
                <span>
                  Signature: <code>{signature}</code>
                </span>
              )}
              <button onClick={onVerify} disabled={!safeAddress || !messageHash}>
                Verify signature
              </button>
            </div>
          </>
        )}
      </div>
      {safeAddress && message && currentChainId && (
        <div>
          <EIP191 chainId={currentChainId} safeAddress={safeAddress} message={message} />
          <EIP712 chainId={currentChainId} safeAddress={safeAddress} message={message} />
        </div>
      )}

      {safeAddress && currentChainId && (
        <div>
          <EIP5792 chainId={currentChainId} safeAddress={safeAddress} onRequest={onBundleRequest} />
        </div>
      )}
    </main>
  )
}
