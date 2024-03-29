import { hashMessage, isAddress, _TypedDataEncoder } from 'ethers/lib/utils'

import { TX_SERVICE_URLS } from '@/config/constants'
import { hashTypedData } from '@/utils/web3'
import type { EIP712TypedData } from '@/utils/web3'

/**
 * The `SafeMessage` `message` field is a hash of the message to be signed
 */
export const generateSafeMessageMessage = (message: string | EIP712TypedData): string => {
  return typeof message === 'string' ? hashMessage(message) : hashTypedData(message)
}

/**
 * Generates `SafeMessage` typed data for signing
 * https://github.com/safe-global/safe-contracts/blob/main/contracts/handler/CompatibilityFallbackHandler.sol#L12
 */
export const generateSafeMessageTypedData = (
  chainId: number,
  safeAddress: string,
  message: string | EIP712TypedData,
): EIP712TypedData | undefined => {
  if (!isAddress(safeAddress) || !message) {
    return
  }

  return {
    domain: {
      // TODO: if 1.1.1. Safe do not use chainId here
      chainId: chainId,
      verifyingContract: safeAddress,
    },
    types: {
      SafeMessage: [{ name: 'message', type: 'bytes' }],
    },
    message: {
      message: generateSafeMessageMessage(message),
    },
  }
}

enum SignatureType {
  CONTRACT_SIGNATURE = 'CONTRACT_SIGNATURE',
  APPROVED_HASH = 'APPROVED_HASH',
  EOA = 'EOA',
  ETH_SIGN = 'ETH_SIGN',
}

type TransactionServiceSafeMessage = {
  created: string
  modified: string
  messageHash: string
  message: string | EIP712TypedData
  proposedBy: string // Address of the owner that proposed the message
  safeAppId: number | null
  confirmations: {
    created: string
    modified: string
    owner: string
    signature: string
    signatureType: SignatureType
  }[]
  preparedSignature: string // Will be continuously updated by service, but only valid until threshold met
}
