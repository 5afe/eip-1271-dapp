import WalletConnect from '@walletconnect/client'
import QRCodeModal from '@walletconnect/qrcode-modal'
import { useMemo } from 'react'

import { WC_BRIDGE } from '@/config/constants'

export const useWalletConnect = (): InstanceType<typeof WalletConnect> => {
  return useMemo(() => {
    return new WalletConnect({
      bridge: WC_BRIDGE,
      qrcodeModal: QRCodeModal,
    })
  }, [])
}
