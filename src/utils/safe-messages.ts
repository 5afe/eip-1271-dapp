import { hashMessage, _TypedDataEncoder } from 'ethers/lib/utils';

type EIP712TypedData = ReturnType<typeof _TypedDataEncoder.getPayload>;

export const hashTypedData = (typedData: EIP712TypedData): string => {
  // `ethers` doesn't require `EIP712Domain` and otherwise throws
  const { EIP712Domain: _, ...types } = typedData.types;
  return _TypedDataEncoder.hash(typedData.domain, types, typedData.message);
};

/**
 * Generates `SafeMessage` types for signing
 * https://github.com/safe-global/safe-contracts/blob/main/contracts/handler/CompatibilityFallbackHandler.sol#L12
 */
export const generateSafeMessageTypes = (
  chainId: number,
  safeAddress: string,
  message: string | EIP712TypedData
): EIP712TypedData => {
  return {
    domain: {
      chainId: chainId,
      verifyingContract: safeAddress,
    },
    types: {
      SafeMessage: [{ name: 'message', type: 'bytes' }],
    },
    message: {
      message:
        typeof message === 'string'
          ? hashMessage(message)
          : hashTypedData(message),
    },
  };
};
