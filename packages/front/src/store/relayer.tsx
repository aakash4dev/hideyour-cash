import { useEnv } from "@/hooks/useEnv";
import { RelayerStore } from "@/interfaces";
import { hycService } from "@/lib";
import { debounce } from "@/utils/debounce";
import { RelayerDataInterface } from "hideyourcash-sdk";
import { create } from "zustand";
import { useWithdraw } from "./withdraw";

const relayerNetwork = useEnv("VITE_RELAYER_NETWORK");

const initialDynamicFee = {
  token: "",
  valid_fee_for_ms: 0,
  human_network_fee: "",
  price_token_fee: "",
  formatted_user_will_receive: "",
  formatted_token_fee: "",
};

export const useRelayer = create<RelayerStore>((set, get) => ({
  relayerData: null,
  relayerJWT: "",
  loadingDynamicFee: false,
  dynamicFee: initialDynamicFee,
  recipientAddressError: "",
  toRef: null,
  getRelayerFee: async (
    accountId: string,
    instanceId: string,
    relayer: RelayerDataInterface
  ) => {
    return hycService.getRelayerFee(relayer, accountId, instanceId);
  },

  fetchRelayerData: async () => {
    const data = await hycService.getRandomRelayer(relayerNetwork);

    set({ relayerData: data[0] });
  },
  setRelayerJWT: (value) => {
    set({ relayerJWT: value });
  },
  createTimeout: (ms: number, address: string) => {
    const { checkRelayerFee, toRef } = get();
    if (toRef) {
      clearTimeout(toRef);
    }

    set({
      toRef: setTimeout(() => {
        checkRelayerFee(address);
      }, ms),
    });
  },

  checkRelayerFee: debounce(async (address: string) => {
    const { ticket } = useWithdraw.getState();

    const { relayerData, getRelayerFee, createTimeout } = get();

    set({
      dynamicFee: initialDynamicFee,
    });

    if (!address || !ticket!.contract) {
      return;
    }

    set({
      loadingDynamicFee: true,
      recipientAddressError: '',
    });

    try {
      const { data } = await getRelayerFee(
        address,
        ticket!.contract,
        relayerData!,
      );

      set({ dynamicFee: data, relayerJWT: data.token });

      createTimeout(data.valid_fee_for_ms, address);
    } catch (error) {
      console.warn(error);

      set({
        dynamicFee: initialDynamicFee,
        recipientAddressError: "Your recipient address is not valid",
      });

    } finally {
      set({ loadingDynamicFee: false });
    }
  }, 500),
}));
