import { ethers } from 'ethers'
import { hexZeroPad, _TypedDataEncoder } from 'ethers/lib/utils'

export type EIP712TypedData = ReturnType<typeof _TypedDataEncoder.getPayload>

export const hashTypedData = (typedData: EIP712TypedData): string => {
  // `ethers` doesn't require `EIP712Domain` and otherwise throws
  const { EIP712Domain: _, ...types } = typedData.types
  return _TypedDataEncoder.hash(typedData.domain, types, typedData.message)
}

export const getExampleTypedData = (chainId: number, verifyingContract: string, testString: string) => {
  return {
    types: {
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' },
      ],
      Nested: [
        { name: 'nestedString', type: 'string' },
        { name: 'nestedAddress', type: 'address' },
        { name: 'nestedUint256', type: 'uint256' },
        { name: 'nestedUint32', type: 'uint32' },
        { name: 'nestedBytes32', type: 'bytes32' },
        { name: 'nestedBoolean', type: 'bool' },
      ],
      Example: [
        { name: 'testString', type: 'string' },
        { name: 'testAddress', type: 'address' },
        { name: 'testUint256', type: 'uint256' },
        { name: 'testUint32', type: 'uint32' },
        { name: 'testBytes32', type: 'bytes32' },
        { name: 'testBoolean', type: 'bool' },
        { name: 'testNested', type: 'Nested' },
      ],
    },
    primaryType: 'Example',
    domain: {
      name: 'EIP-1271 Example DApp',
      version: '1.0',
      chainId,
      verifyingContract,
    },
    message: {
      testString,
      testAddress: verifyingContract,
      testUint256: ethers.utils.parseEther('999999999'),
      testUint32: '123',
      testBytes32: hexZeroPad('0xdeadbeef', 32),
      testBoolean: true,
      testNested: {
        nestedString: testString,
        nestedAddress: hexZeroPad('0x2', 20),
        nestedUint256: 0,
        nestedUint32: 1,
        nestedBytes32: hexZeroPad('0xda7a', 32),
        nestedBoolean: false,
      },
    },
  }
}
