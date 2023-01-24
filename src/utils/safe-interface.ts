import { SignClient } from '@walletconnect/sign-client/dist/types/client'
import { ethers } from 'ethers'
import { BigNumber, Contract } from 'ethers/lib/ethers'
import { Interface } from 'ethers/lib/utils'

const getSafeInterface = () => {
  const SAFE_ABI = [
    'function getThreshold() public view returns (uint256)',
    'function getMessageHash(bytes memory message) public view returns (bytes32)',
    'function isValidSignature(bytes calldata _data, bytes calldata _signature) public view returns (bytes4)',
  ]

  return new Interface(SAFE_ABI)
}

export const getThreshold = async (connector: ethers.providers.JsonRpcProvider, safeAddress: string) => {
  let threshold: number | undefined

  try {
    // https://github.com/safe-global/safe-contracts/blob/main/contracts/base/OwnerManager.sol#L126
    const res = await new Contract(safeAddress, getSafeInterface()).connect(connector).getThreshold()
    threshold = BigNumber.from(res).toNumber()
  } catch (e) {
    console.error(e)
  }

  return threshold
}

export const getSafeMessageHash = async (
  connector: ethers.providers.JsonRpcProvider,
  safeAddress: string,
  messageHash: string,
) => {
  let safeMessageHash: string | undefined

  try {
    // https://github.com/safe-global/safe-contracts/blob/main/contracts/handler/CompatibilityFallbackHandler.sol#L43
    safeMessageHash = await new Contract(safeAddress, getSafeInterface()).connect(connector).getMessageHash(messageHash)
  } catch (e) {
    console.error(e)
  }

  return safeMessageHash
}

export const isValidSignature = async (
  connector: ethers.providers.JsonRpcProvider,
  safeAddress: string,
  messageHash: string,
  signature: string,
) => {
  const MAGIC_VALUE_BYTES = '0x20c13b0b'

  let isValidSignature: string | undefined

  try {
    // https://github.com/safe-global/safe-contracts/blob/main/contracts/handler/CompatibilityFallbackHandler.sol#L28
    isValidSignature = await new Contract(safeAddress, getSafeInterface())
      .connect(connector)
      .isValidSignature(messageHash, signature)
  } catch (e) {
    console.error(e)
  }

  return isValidSignature?.slice(0, 10).toLowerCase() === MAGIC_VALUE_BYTES
}
