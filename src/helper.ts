import { Finding } from "forta-agent";
import { BigNumber, providers, Contract } from "ethers";
import { L1_ESCROW_ABI, DAI_TOKEN_ADDR, OPT_L1ESCROW, L2_TOKEN_ADDR, L2_ABI, ARB_L1ESCROW } from "./constants";
import { createFinding, createL1Finding } from "./findings";
import { AlertsResponse } from "forta-agent/dist/sdk/graphql/forta";
import { getL1Alerts } from "./l1Alerts";

export const getContract = (contractAddr: string, abi: any, provider: any) => {
  return new Contract(contractAddr, abi, provider);
};

//Helper function to get the opt/arb L2 supply
export const getBalL2 = async (tokenContract: Contract, blockNumber: number) => {
  return await tokenContract.totalSupply({ blockTag: blockNumber });
};

//Function that gets the balances of the optimism and arbitrum escrows and sends out an alerts of both supplies
export const getL1Balances = async (provider: providers.Provider, blockNumber: number, findings: Finding[]) => {
  const daiToken = getContract(DAI_TOKEN_ADDR, L1_ESCROW_ABI, provider);

  const optEscrBal: BigNumber = await daiToken.balanceOf(OPT_L1ESCROW, {
    blockTag: blockNumber,
  });
  const arbEscrBal: BigNumber = await daiToken.balanceOf(ARB_L1ESCROW, {
    blockTag: blockNumber,
  });

  findings.push(createL1Finding(optEscrBal, arbEscrBal));
};

//check that the block number is the same as the block number when the eth escrows were checked
export const checkCondition = async (
  provider: providers.Provider,
  blockNumber: number,
  findings: Finding[],
  chainId: number
) => {
  const l2Contr = getContract(L2_TOKEN_ADDR, L2_ABI, provider);
  const l2Balance: BigNumber = await getBalL2(l2Contr, blockNumber);

  const l1Alerts: AlertsResponse = await getL1Alerts(blockNumber);

  if (l1Alerts.alerts.length == 0) {
    return findings;
  }

  let l1Balance: BigNumber;
  let l2Network: string;

  if (chainId == 10) {
    l1Balance = l1Alerts.alerts[0].metadata.OptEscrBal;
    l2Network = "Optimism";
  } else {
    l1Balance = l1Alerts.alerts[0].metadata.ArbEscrBal;
    l2Network = "Arbitrum";
  }

  if (l1Balance.lt(l2Balance)) {
    findings.push(createFinding(l1Balance, l2Balance, l2Network));
  }
};
