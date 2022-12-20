import { useMemo } from 'react'
import type { ReactElement } from 'react'

import { generateSafeMessageTypedData, generateSafeMessageMessage } from '@/utils/safe-messages'
import { getExampleTypedData, hashTypedData } from '@/utils/web3'

export const EIP712 = ({
  chainId,
  safeAddress,
  message,
}: {
  chainId: number
  safeAddress: string
  message: string
}): ReactElement => {
  const exampleTypedData = useMemo(() => {
    if (!chainId || !safeAddress || !message) {
      return
    }

    return getExampleTypedData(chainId, safeAddress, message)
  }, [chainId, safeAddress, message])

  const messageHash = useMemo(() => {
    if (!exampleTypedData) {
      return
    }

    return generateSafeMessageMessage(exampleTypedData)
  }, [exampleTypedData])

  const safeMessageHash = useMemo(() => {
    if (!chainId || !safeAddress || !message) {
      return
    }

    const safeMessageTypedData = generateSafeMessageTypedData(chainId, safeAddress, exampleTypedData)
    return hashTypedData(safeMessageTypedData)
  }, [chainId, safeAddress, message])

  return (
    <>
      <span>EIP-712</span>
      <pre>Message hash (SafeMessage): {messageHash}</pre>
      <pre>SafeMessage hash: {safeMessageHash}</pre>
      {exampleTypedData && (
        <details style={{ cursor: 'pointer' }}>
          <summary>Example typed data</summary>
          <pre>{JSON.stringify(exampleTypedData, null, 2)}</pre>
        </details>
      )}
    </>
  )
}
