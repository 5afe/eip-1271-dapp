# Safe off-chain signing demo

Example DApp that supports on-/off-chain signing via the Safe (currently with EOAs, but Smart Contract wallet support will soon be implemented).

**Please note that all linked repositories and deployments are subject to change.**

## Signing messages in a Safe

### Installing dependencies

```
yarn install
```

### Custom deployments

- [Safe UI](https://github.com/safe-global/web-core/pull/1270#issuecomment-1334078694)
- [WalletConnect Safe App](https://github.com/safe-global/safe-react-apps/pull/608#issuecomment-1339464666)

### Connecting to a Safe

To connect a Safe to this DApp, a [custom WalletConnect Safe App](https://pr608--safereactapps.review-react-hr.5afe.dev/wallet-connect/) needs to be added to the Safe interface.

1. Run the test DApp by running `yarn start` and click "Connect" to open the WalletConnect modal.
2. Open your test Safe via [this test deployment](https://eip-1271-communicator--webcore.review-web-core.5afe.dev), connect your wallet and navigate to "Apps" in the sidebar.
3. Add `https://pr608--safereactapps.review-react-hr.5afe.dev/wallet-connect/` as a custom App and open it in the UI \*
4. Copy the WalletConnect QR code and enter it into the custom Safe App.

\* If you encounter the "The Safe App is taking too long to load, consider refreshing." error, you may need to add `%2F` to the end of the URL, e.g.

`https://app.safe.global/<SAFE_ADDRESS>/apps?appUrl=https%3A%2F%2Fpr608--safereactapps.review-react-hr.5afe.dev%2Fwallet-connect%2F`

### Signing off-chain

After connecting a Safe via WalletConnect, you should see the address of the connected Safe address in the test DApp. To toggle off-chain signing, click "Enable off-chain signing".

By entering a message and clicking "Sign message" or "Sign message in example typed data", the Safe will sign the message off-chain. It is possible to see a list of messages signed off chain in the Safe UI in the "Transactions" section under the "Messages" tab (example [here](https://eip-1271-communicator--webcore.review-web-core.5afe.dev/gor:0x65c57CC1317a1f728E921Cbf7bC08b3894196D29/transactions/messages)).

The message hash will be automatically populated and can be verified by clicking "Verify signature". A `SafeMessage` is only valid once the Safe threshold has been met.

## Custom integration

Off-chain signing leverages the Safe transaction service in a similar fashion to transactions.

1. A `SafeMessage` is created, signed and proposed to the service.
2. Other Safe owners sign the message until the threshold is met.
3. The message is then valid and its hash can be verified against the contract.

### Signing off-chain with a Safe

The Safe needs to know whether a DApp supports off-chain signing. In order to turn it on, a custom `safe_setSettings` RPC method needs to be called, e.g. using WalletConnect:

```ts
type SafeSettings = {
  offChainSigning?: boolean
}

const settings: SafeSettings = {
  offChainSigning: true,
}

const enableOffChainSigning = async () => {
  await connector.sendCustomRequest({
    method: 'safe_setSettings',
    params: [settings],
  })
}
```

After enabling off-chain signing, all `eth_sign` or `eth_signTypedData` calls will sign off-chain. When calling either, the following is returned upon successful sign.

```ts
{
  messageHash: string // `SafeMessage` hash
}
```

Note: each App "session" needs to enable off-chain signing. If the Safe is closed or the "Apps" section navigated away from, it will default to on-chain signing again.

### Verifying an off-chain signature

1. Get the message hash by calling [`getMessageHash`](https://github.com/safe-global/safe-contracts/blob/main/contracts/handler/CompatibilityFallbackHandler.sol#L43) from the contract or from a successful `eth_sign` or `eth_signTypedData`.
2. Fetch the `SafeMessage` and its signatures from the transaction service from `<TRANSACTION_SERVICE>/api/v1/messages/<MESSAGE_HASH>` with the message hash.
3. Check the validity of the signature by calling [`isValidSignature`](https://github.com/safe-global/safe-contracts/blob/main/contracts/handler/CompatibilityFallbackHandler.sol#L28) on the contract.

### Links

- [Demo SDK](https://github.com/safe-global/safe-apps-sdk/pull/414)

## How does it work?

The test DApp includes example code outlining the `SafeMessage`. A signed `SafeMessage` is what is used to verify the validity of an _original_ EIP-191/EIP-712 message.

When signing off-chain, the user does not sign the _original_ message but a `SafeMessage`. A `SafeMessage` is an EIP-712 structured message, containing the `chainId`, `verifyingContract` (current Safe address) and hash of the _original_ message. By signing this, the signature is guaranteed to be unique for the _original_ message.

```ts
const safeAddress = '0x65c57CC1317a1f728E921Cbf7bC08b3894196D29'

const hashedMessagee = '0x8144a6fa26be252b86456491fbcd43c1de7e022241845ffea1c3df066f7cfede' // Hello world

const SafeMessage = {
  domain: {
    chainId,
    verifyingContract: safeAddress,
  },
  types: {
    SafeMessage: [{ name: 'message', type: 'bytes' }],
  },
  message: {
    message: hashedMessagee,
  },
}
```
