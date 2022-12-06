import WalletConnect from '@walletconnect/client';
import QRCodeModal from '@walletconnect/qrcode-modal';
import { useMemo } from 'react';

import { WC_BRIDGE } from '@/config/constants';

const STORAGE_KEY = 'walletconnect';

const useWalletConnect = (): InstanceType<typeof WalletConnect> => {
  if (localStorage.getItem(STORAGE_KEY)) {
    localStorage.removeItem(STORAGE_KEY);
  }

  return useMemo(() => {
    return new WalletConnect({
      bridge: WC_BRIDGE,
      qrcodeModal: QRCodeModal,
      storageId: STORAGE_KEY,
    });
  }, []);
};

export default useWalletConnect;
