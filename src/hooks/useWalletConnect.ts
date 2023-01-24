import { WC_PROJECT_ID } from '@/config/constants'
import SignClient from '@walletconnect/sign-client'
import { useEffect, useState } from 'react'

export const useWalletConnect = (): SignClient | undefined => {
  const [signClient, setSignClient] = useState<SignClient>()

  useEffect(() => {
    const initiateClient = async () => {
      const client = await SignClient.init({
        projectId: WC_PROJECT_ID,
        metadata: {
          name: 'Example EIP 1271 Dapp',
          description: 'Example EIP 1271 Dapp',
          url: 'http://localhost',
          icons: ['https://walletconnect.com/walletconnect-logo.png'],
        },
      })
      setSignClient(client)
    }
    initiateClient()
  }, [])

  return signClient
}
