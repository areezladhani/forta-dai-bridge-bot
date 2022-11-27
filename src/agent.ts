import { Finding, HandleBlock, BlockEvent, getEthersProvider } from "forta-agent";
import { providers } from "ethers";
import { getL1Balances, checkCondition } from "./helper";

export function provideHandleBlock(provider: providers.Provider): HandleBlock {
  return async (block: BlockEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];
    const { chainId } = await provider.getNetwork();

    // We check an emit an alert with the total supply of both escrows per block
    if (chainId == 1) {
      try {
        const checkEmitL1Bal = await getL1Balances(provider, block.blockNumber, findings);
      } catch {
        return findings;
      }
    }
    // if l1 escrow < l2supply, emit a alert
    if (chainId != 1) {
      try {
        const l2Cond = await checkCondition(provider, block.blockNumber, findings, chainId);
      } catch {
        return findings;
      }
    }
    return findings;
  };
}

export default {
  handleBlock: provideHandleBlock(getEthersProvider()),
  // handleBlock
};
