import WalletConnect from '@walletconnect/client'
import QRCodeModal from '@walletconnect/qrcode-modal'
import { useMemo } from 'react'

import { WC_BRIDGE } from '@/config/constants'

const useWalletConnect = (): InstanceType<typeof WalletConnect> => {
  return useMemo(() => {
    return new WalletConnect({
      bridge: WC_BRIDGE,
      qrcodeModal: QRCodeModal,
    })
  }, [])
}

export default useWalletConnect
