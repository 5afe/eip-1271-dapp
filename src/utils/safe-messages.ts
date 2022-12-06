import { hashMessage, isAddress, _TypedDataEncoder } from 'ethers/lib/utils';

type EIP712TypedData = ReturnType<typeof _TypedDataEncoder.getPayload>;

export const hashTypedData = (
  typedData: EIP712TypedData
): string | undefined => {
  let hash: string | undefined;

  try {
    // `ethers` doesn't require `EIP712Domain` and otherwise throws
    const { EIP712Domain: _, ...types } = typedData.types;
    hash = _TypedDataEncoder.hash(typedData.domain, types, typedData.message);
  } catch {
    // Ignore
  }

  return hash;
};

/**
 * Generates `SafeMessage` typed data for signing
 * https://github.com/safe-global/safe-contracts/blob/main/contracts/handler/CompatibilityFallbackHandler.sol#L12
 */
export const generateSafeMessageTypedData = (
  chainId: number,
  safeAddress: string,
  message: string | EIP712TypedData
): EIP712TypedData => {
  if (!isAddress(safeAddress)) {
    return;
  }

  let safeMessage: EIP712TypedData | undefined;

  try {
    safeMessage = {
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
  } catch {
    // Ignore
  }

  return safeMessage;
};
