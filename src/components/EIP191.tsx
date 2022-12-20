import { useMemo } from 'react'
import type { ReactElement } from 'react'

import { generateSafeMessageMessage, generateSafeMessageTypedData } from '@/utils/safe-messages'
import { hashTypedData } from '@/utils/web3'

export const EIP191 = ({
  chainId,
  safeAddress,
  message,
}: {
  chainId: number
  safeAddress: string
  message: string
}): ReactElement => {
  const messageHash = useMemo(() => {
    if (!message) {
      return
    }

    return generateSafeMessageMessage(message)
  }, [message])

  const safeMessageHash = useMemo(() => {
    if (!chainId || !safeAddress || !message) {
      return
    }

    const safeMessageTypedData = generateSafeMessageTypedData(chainId, safeAddress, message)
    return hashTypedData(safeMessageTypedData)
  }, [chainId, safeAddress, message])

  return (
    <>
      <span>EIP-191</span>
      <pre>Message hash (SafeMessage): {messageHash}</pre>
      <pre>SafeMessage hash: {safeMessageHash}</pre>
    </>
  )
}
