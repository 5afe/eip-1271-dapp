import { useMemo } from 'react'
import type { ReactElement } from 'react'

import { generateSafeMessageTypedData, generateSafeMessageMessage } from '@/utils/safe-messages'
import { getPermit2TypedData, hashTypedData } from '@/utils/web3'

export const EIP712 = ({ chainId, safeAddress }: { chainId: number; safeAddress: string }): ReactElement => {
  const exampleTypedData = useMemo(() => {
    if (!chainId || !safeAddress) {
      return
    }

    return getPermit2TypedData(chainId)
  }, [chainId, safeAddress])

  const messageHash = useMemo(() => {
    if (!exampleTypedData) {
      return
    }

    return generateSafeMessageMessage(exampleTypedData)
  }, [exampleTypedData])

  const safeMessageHash = useMemo(() => {
    if (!chainId || !safeAddress) {
      return
    }

    const safeMessageTypedData = generateSafeMessageTypedData(chainId, safeAddress, exampleTypedData)
    return hashTypedData(safeMessageTypedData)
  }, [chainId, safeAddress])

  return (
    <>
      <span>EIP-712</span>
      <pre>Message hash (SafeMessage): {messageHash}</pre>
      <pre>SafeMessage hash: {safeMessageHash}</pre>
      {exampleTypedData && (
        <details style={{ cursor: 'pointer' }}>
          <summary>Permit Single payload</summary>
          <pre>{JSON.stringify(exampleTypedData, null, 2)}</pre>
        </details>
      )}
    </>
  )
}
