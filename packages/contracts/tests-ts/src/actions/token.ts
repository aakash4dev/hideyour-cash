import fs from "fs";
import { Account } from "near-api-js";
import { BN } from "near-workspaces";
import { AttachedGas } from "../constants";
import { getTransaction, viewFunction } from "../utils/near";

export const deployToken = async ({
  account,
  owner,
}: {
  account: Account;
  owner: Account;
}): Promise<void> => {
  const contractWasm = fs.readFileSync("../out/fungible_token.wasm");

  await account.deployContract(contractWasm);

  await account.functionCall({
    contractId: account.accountId,
    methodName: "new",
    args: {
      owner_id: owner.accountId,
      total_supply: "1000000000000000",
      metadata: {
        spec: "ft-1.0.0",
        name: "test-USD",
        symbol: "tUSD",
        icon: "data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none'%3E%3Ccircle cx='16' cy='16' r='16' fill='%232775C9'/%3E%3Cpath d='M15.75 27.5C9.26 27.5 4 22.24 4 15.75S9.26 4 15.75 4 27.5 9.26 27.5 15.75A11.75 11.75 0 0115.75 27.5zm-.7-16.11a2.58 2.58 0 00-2.45 2.47c0 1.21.74 2 2.31 2.33l1.1.26c1.07.25 1.51.61 1.51 1.22s-.77 1.21-1.77 1.21a1.9 1.9 0 01-1.8-.91.68.68 0 00-.61-.39h-.59a.35.35 0 00-.28.41 2.73 2.73 0 002.61 2.08v.84a.705.705 0 001.41 0v-.85a2.62 2.62 0 002.59-2.58c0-1.27-.73-2-2.46-2.37l-1-.22c-1-.25-1.47-.58-1.47-1.14 0-.56.6-1.18 1.6-1.18a1.64 1.64 0 011.59.81.8.8 0 00.72.46h.47a.42.42 0 00.31-.5 2.65 2.65 0 00-2.38-2v-.69a.705.705 0 00-1.41 0v.74zm-8.11 4.36a8.79 8.79 0 006 8.33h.14a.45.45 0 00.45-.45v-.21a.94.94 0 00-.58-.87 7.36 7.36 0 010-13.65.93.93 0 00.58-.86v-.23a.42.42 0 00-.56-.4 8.79 8.79 0 00-6.03 8.34zm17.62 0a8.79 8.79 0 00-6-8.32h-.15a.47.47 0 00-.47.47v.15a1 1 0 00.61.9 7.36 7.36 0 010 13.64 1 1 0 00-.6.89v.17a.47.47 0 00.62.44 8.79 8.79 0 005.99-8.34z' fill='%23FFF'/%3E%3C/g%3E%3C/svg%3E",
        decimals: 6,
      },
    },
    gas: new BN("300000000000000"),
  });
};

export const sendDeposit = async ({
  hash,
  contract,
  token,
  signer,
}: {
  hash: string;
  contract: any;
  token: any;
  signer: any;
}) => {
  const transactions: any[] = [];

  const storage = await getTokenStorage(
    token.accountId,
    contract.accountId,
    "https://rpc.testnet.near.org"
  );

  if (!storage || storage.total < "0.10") {
    transactions.push(
      getTransaction(
        signer.accountId,
        token.accountId,
        "storage_deposit",
        {
          account_id: contract.accountId,
          registration_only: true,
        },
        "0.50"
      )
    );
  }

  transactions.push(
    getTransaction(signer.accountId, token.accountId, "ft_transfer_call", {
      msg: hash,
      memo: null,
      receiver_id: contract.accountId,
      amount: "10000000",
    })
  );

  const outcomes: any[] = [];

  for (let i = 0; i < transactions.length; i++) {
    const { receiverId, actions } = transactions[i];

    const { params: { methodName = "", deposit = "", args = {} } = {} } =
      actions[0] || {};

    const res = await signer.functionCall({
      args,
      contractId: receiverId,
      methodName: methodName,
      gas: AttachedGas as any,
      attachedDeposit: deposit,
    });

    outcomes.push(res);
  }

  return outcomes;
};

export const getTokenStorage = async (
  token: string,
  contract: string,
  nodeRpcUrl: string
) => {
  try {
    return await viewFunction(nodeRpcUrl, token, "storage_balance_of", {
      account_id: contract,
    });
  } catch (e) {
    return;
  }
};
