import WalletConnect from '@walletconnect/client'
import { BigNumber } from 'ethers/lib/ethers'
import { Interface } from 'ethers/lib/utils'

const getSafeInterface = () => {
  const SAFE_ABI = [
    'function getThreshold() public view returns (uint256)',
    'function getMessageHashForSafe(address safe, bytes memory message) public view returns (bytes32)',
    'function isValidSignature(bytes calldata _data, bytes calldata _signature) public view returns (bytes4)',
  ]

  return new Interface(SAFE_ABI)
}

export const getThreshold = async (connector: WalletConnect, safeAddress: string) => {
  let threshold: number | undefined

  try {
    const getThresholdData = getSafeInterface().encodeFunctionData('getThreshold', [])

    const res = (await connector.sendCustomRequest({
      method: 'eth_call',
      params: [{ to: safeAddress, data: getThresholdData }],
    })) as BigNumber

    threshold = BigNumber.from(res).toNumber()
  } catch {
    // Ignore
  }

  return threshold
}

export const getMessageHashForSafe = async (connector: WalletConnect, safeAddress: string, messageHash: string) => {
  let safeMessageHash: string | undefined

  try {
    const getMessageHashForSafeData = getSafeInterface().encodeFunctionData('getMessageHashForSafe', [
      safeAddress,
      messageHash,
    ])

    safeMessageHash = (await connector.sendCustomRequest({
      method: 'eth_call',
      params: [{ to: safeAddress, data: getMessageHashForSafeData }],
    })) as string
  } catch {
    // Ignore
  }

  return safeMessageHash
}

export const isValidSignature = async (
  connector: WalletConnect,
  safeAddress: string,
  messageHash: string,
  signature: string,
) => {
  const MAGIC_VALUE_BYTES = '0x20c13b0b'

  let isValidSignature: string | undefined

  try {
    const isValidSignatureData = getSafeInterface().encodeFunctionData('isValidSignature', [messageHash, signature])

    isValidSignature = (await connector.sendCustomRequest({
      method: 'eth_call',
      params: [{ to: safeAddress, data: isValidSignatureData }],
    })) as string
  } catch {
    // Ignore
  }

  return isValidSignature?.slice(0, 10).toLowerCase() === MAGIC_VALUE_BYTES
}
