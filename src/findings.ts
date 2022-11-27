import { ethers, Finding, FindingSeverity, FindingType } from "forta-agent";

export const createFinding = (l1Escrow: ethers.BigNumber, L2supply: ethers.BigNumber, network: string): Finding => {
  return Finding.fromObject({
    name: ` Total supply of MakerDao l1 escrow is less then ${network} Dai supply on l2`,
    description: `balances: l1Escrow-> ${l1Escrow}, ${network} l2Supply-> ${L2supply}`,
    alertId: `L1 ${network} escrow insolvent`,
    severity: FindingSeverity.Critical,
    type: FindingType.Exploit,
    protocol: `${network}`,
    metadata: {
      l1Escrow: `${l1Escrow}`,
      L2supply: `${L2supply}`,
    },
  });
};
export const createL1Finding = (optEscrBal: ethers.BigNumber, ArbEscrBal: ethers.BigNumber): Finding => {
  return Finding.fromObject({
    name: `Total supply of optimism and Arbitrum MakerDao escrows on layer one Dai`,
    description: `Balances of escrows: Arbitrum-> ${ArbEscrBal} Optimism-> ${optEscrBal}`,
    alertId: "l1-escrow-supply",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "Etherium",
    metadata: {
      optEscrBal: `${optEscrBal}`,
      ArbEscrBal: `${ArbEscrBal}`,
    },
  });
};
