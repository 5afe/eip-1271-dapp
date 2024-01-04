import { SyntheticEvent, useMemo } from 'react'

export const EIP5792 = ({
  chainId,
  safeAddress,
  onRequest,
}: {
  chainId: number
  safeAddress: string
  onRequest: (req: { method: string; params: any[] }) => void
}) => {
  const data = useMemo(
    () => [
      {
        chainId: chainId,
        from: safeAddress,
        calls: [
          {
            to: '0x0000000000000000000000000000000000000000',
            value: 0,
            data: '0x',
            gas: '0x76c0',
          },
          {
            to: '0x0000000000000000000000000000000000000000',
            value: 0,
            data: '0x0',
            gas: '0x76c0',
          },
        ],
      },
    ],
    [chainId, safeAddress],
  )

  const onSubmit = async (e: SyntheticEvent) => {
    e.preventDefault()
    const params = JSON.parse(((e.target as any).elements.calls as HTMLTextAreaElement).value)
    onRequest({
      method: 'wallet_sendFunctionCallBundle',
      params,
    })
  }

  const callsJson = JSON.stringify(data, null, 2)

  return (
    <div>
      <h1>Send wallet_sendFunctionCallBundle</h1>

      <form onSubmit={onSubmit}>
        <textarea name="calls" rows={callsJson.split('\n').length} style={{ width: '100%' }}>
          {callsJson}
        </textarea>

        <button type="submit">Send</button>
      </form>
    </div>
  )
}
