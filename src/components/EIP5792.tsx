import { SyntheticEvent, useMemo, useState } from 'react'

export const EIP5792 = ({
  chainId,
  safeAddress,
  onRequest,
}: {
  chainId: number
  safeAddress: string
  onRequest: (req: { method: string; params: any[] }) => Promise<string | null>
}) => {
  const [txHash, setTxHash] = useState<string | null>(null)
  const [status, setStatus] = useState<any>()

  const data = useMemo(
    () => [
      {
        chainId: chainId,
        from: safeAddress,
        calls: [
          {
            to: '0x0000000000000000000000000000000000000000',
            value: '0x1',
            data: '0x',
            gas: '0x76c0',
          },
          {
            to: '0x0000000000000000000000000000000000000000',
            value: '0x2',
            data: '0x',
            gas: '0x76c0',
          },
        ],
      },
    ],
    [chainId, safeAddress],
  )

  const onSend = async (e: SyntheticEvent) => {
    e.preventDefault()

    setTxHash(null)
    setStatus(null)
    const params = JSON.parse(((e.target as any).elements.calls as HTMLTextAreaElement).value)

    const txHash = await onRequest({
      method: 'wallet_sendFunctionCallBundle',
      params,
    })

    if (txHash) {
      setTxHash(txHash)
    }
  }

  const onCheckStatus = async (e: SyntheticEvent) => {
    e.preventDefault()

    setStatus(null)

    if (!txHash) {
      return
    }

    const data = await onRequest({
      method: 'wallet_getBundleStatus',
      params: [txHash],
    })

    console.log(status)

    setStatus(data)
  }

  return (
    <div>
      <h1>Send wallet_sendFunctionCallBundle</h1>

      <form onSubmit={onSend}>
        <textarea name="calls" rows={20} style={{ width: '100%' }} defaultValue={JSON.stringify(data, null, 2)} />
        <button type="submit">Send</button> {txHash && <button onClick={onCheckStatus}>Check status</button>}
      </form>

      {status && (
        <>
          <label>
            <h2>Status</h2>
            <textarea readOnly defaultValue={JSON.stringify(status, null, 2)} rows={20} style={{ width: '100%' }} />
          </label>
        </>
      )}
    </div>
  )
}
