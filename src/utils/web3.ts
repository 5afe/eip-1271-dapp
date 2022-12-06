import { _TypedDataEncoder } from 'ethers/lib/utils'

export type EIP712TypedData = ReturnType<typeof _TypedDataEncoder.getPayload>

export const hashTypedData = (typedData: EIP712TypedData): string => {
  // `ethers` doesn't require `EIP712Domain` and otherwise throws
  const { EIP712Domain: _, ...types } = typedData.types
  return _TypedDataEncoder.hash(typedData.domain, types, typedData.message)
}

export const getExampleTypedData = (chainId: number, verifyingContract: string, contents: string) => {
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
