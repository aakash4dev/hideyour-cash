import { WalletSelector } from "@near-wallet-selector/core";

export interface WalletStore {
  toggleModal: () => void;
  signOut: () => Promise<void>;
  initWallet: () => Promise<string>;
  viewBalance: (contract: string) => Promise<void>;
  sendWhitelist: () => Promise<void>;
  viewNearBalance: () => Promise<any>;
  accountId: string | null;
  showWalletModal: boolean;
  selector: WalletSelector | null;
}
export interface Balance {
  total: string;
  stateStaked: string;
  staked: string;
  available: string;
}
