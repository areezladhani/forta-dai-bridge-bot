import { MockEthersProvider } from "forta-agent-tools/lib/test";
import { ethers, HandleBlock, createBlockEvent } from "forta-agent";
import { provideHandleBlock } from "./agent";
import { BigNumber } from "ethers";
import { Interface } from "ethers/lib/utils";
import { L1_ESCROW_ABI, L2_TOKEN_ADDR } from "./constants";
import { ARB_L1ESCROW, OPT_L1ESCROW, DAI_TOKEN_ADDR, L2_ABI } from "./constants";
import { createFinding, createL1Finding } from "./findings";

// Test values for when the escrow values are less then the l2 token supply leading to an imbalance alert
const TEST_VAL1 = {
  OPT_ESCROW_ADDR: OPT_L1ESCROW,
  OPT_ESCROW_VAL: BigNumber.from("100"),
  ARB_ESCROW_ADDR: ARB_L1ESCROW,
  ARB_ESCROW_VAL: BigNumber.from("400"),
  OPT_L2_val: BigNumber.from("500"),
  ARB_L2_val: BigNumber.from("700"),
};

// Test values for when the escrow values are greater or equal to the l2 token supply leading to no alert
const TEST_VAL2 = {
  OPT_ESCROW_ADDR: OPT_L1ESCROW,
  OPT_ESCROW_VAL: BigNumber.from("500"),
  ARB_ESCROW_ADDR: ARB_L1ESCROW,
  ARB_ESCROW_VAL: BigNumber.from("400"),
  OPT_L2_val: BigNumber.from("100"),
  ARB_L2_val: BigNumber.from("100"),
};

// mock of an alert we receive when fecthing alerts of the l1 escrow supplies
const ALERT_RETURN = {
  alerts: [
    {
      metadata: {
        OptEscrBal: TEST_VAL1.OPT_ESCROW_VAL,
        ArbEscrBal: TEST_VAL1.ARB_ESCROW_VAL,
      },
    },
  ],
  pageInfo: {
    hasNextPage: false,
    endCursor: {
      alertId: "l1 escrow supply",
      blockNumber: 10,
    },
  },
};

// we use jest.mock to simulate a return when the getL1Alerts function is called for testing purposes
jest.mock("./l1Alerts.ts", () => ({
  getL1Alerts: () => ALERT_RETURN,
}));

const L1_IFACE = new ethers.utils.Interface(L1_ESCROW_ABI);
const L2_IFACE = new ethers.utils.Interface(L2_ABI);

// helper function that simulates a function call from a certain contract
// E.G for token0 function in pool contract we return the token address when called with correct params
const MakeMockCall = (
  mockProvider: MockEthersProvider,
  id: string,
  inp: any[],
  outp: any[],
  addr: string,
  intface: Interface,
  block: number = 10
) => {
  mockProvider.addCallTo(addr, block, intface, id, {
    inputs: inp,
    outputs: outp,
  });
};

describe("Dai bridge l1-l2 solvency check", () => {
  let handleBlock: HandleBlock;
  let mockProvider: MockEthersProvider;
  let provider: ethers.providers.Provider;

  beforeEach(() => {
    mockProvider = new MockEthersProvider();
    provider = mockProvider as unknown as ethers.providers.Provider;
    handleBlock = provideHandleBlock(provider);
  });

  it("returns a finding for layer one escrows when on the eth network", async () => {
    const blockEvent = createBlockEvent({
      block: { hash: "0xa", number: 10 } as any,
    });

    mockProvider
      .addCallTo(DAI_TOKEN_ADDR, 10, L1_IFACE, "balanceOf", {
        inputs: [TEST_VAL1.OPT_ESCROW_ADDR],
        outputs: [TEST_VAL1.OPT_ESCROW_VAL],
      })
      .addCallTo(DAI_TOKEN_ADDR, 10, L1_IFACE, "balanceOf", {
        inputs: [TEST_VAL1.ARB_ESCROW_ADDR],
        outputs: [TEST_VAL1.ARB_ESCROW_VAL],
      });

    mockProvider.setNetwork(1);

    const findings = await handleBlock(blockEvent);

    const expectedFindings = createL1Finding(TEST_VAL1.OPT_ESCROW_VAL, TEST_VAL1.ARB_ESCROW_VAL);

    expect(findings.length).toEqual(1);
    expect(findings).toStrictEqual([expectedFindings]);
  });

  it("returns empty from the l2 networks, if the eth escrow suppliies have not been recorded yet", async () => {
    const blockEvent = createBlockEvent({
      block: { hash: "0xa", number: 10 } as any,
    });

    jest.mock("./l1Alerts.ts", () => ({
      getL1Alerts: () => [],
    }));

    mockProvider.addCallTo(L2_TOKEN_ADDR, 10, L2_IFACE, "totalSupply", {
      inputs: [],
      outputs: [TEST_VAL2.OPT_L2_val],
    });

    mockProvider.setNetwork(10);

    const findings = await handleBlock(blockEvent);

    expect(findings.length).toEqual(0);
    expect(findings).toStrictEqual([]);
  });

  it("returns no finding if the optimism layer 2 dai supply is less then the layer 1 escrow dai balance", async () => {
    const blockEvent = createBlockEvent({
      block: { hash: "0xa", number: 10 } as any,
    });

    mockProvider.addCallTo(L2_TOKEN_ADDR, 10, L2_IFACE, "totalSupply", {
      inputs: [],
      outputs: [TEST_VAL2.OPT_L2_val],
    });

    mockProvider.setNetwork(10);

    const findings = await handleBlock(blockEvent);

    expect(findings.length).toEqual(0);
    expect(findings).toStrictEqual([]);
  });

  it("returns no finding if the Arbitrum layer 2 dai supply is less then the layer 1 escrow dai balance", async () => {
    const blockEvent = createBlockEvent({
      block: { hash: "0xa", number: 10 } as any,
    });

    mockProvider.addCallTo(L2_TOKEN_ADDR, 10, L2_IFACE, "totalSupply", {
      inputs: [],
      outputs: [TEST_VAL2.ARB_L2_val],
    });

    mockProvider.setNetwork(42161);

    const findings = await handleBlock(blockEvent);

    expect(findings.length).toEqual(0);
    expect(findings).toStrictEqual([]);
  });

  it("returns a finding if the optimism layer 2 dai supply is more then the layer 1 escrow dai balance", async () => {
    const blockEvent = createBlockEvent({
      block: { hash: "0xa", number: 10 } as any,
    });

    mockProvider.addCallTo(L2_TOKEN_ADDR, 10, L2_IFACE, "totalSupply", {
      inputs: [],
      outputs: [TEST_VAL1.OPT_L2_val],
    });

    mockProvider.setNetwork(10);

    const findings = await handleBlock(blockEvent);

    const expectedFindings = createFinding(TEST_VAL1.OPT_ESCROW_VAL, TEST_VAL1.OPT_L2_val, "Optimism");

    expect(findings.length).toEqual(1);
    expect(findings).toStrictEqual([expectedFindings]);
  });

  it("returns a finding if the arbitrum layer 2 dai supply is more then the layer 1 escrow dai balance", async () => {
    const blockEvent = createBlockEvent({
      block: { hash: "0xa", number: 10 } as any,
    });

    mockProvider.addCallTo(L2_TOKEN_ADDR, 10, L2_IFACE, "totalSupply", {
      inputs: [],
      outputs: [TEST_VAL1.ARB_L2_val],
    });

    mockProvider.setNetwork(42161);

    const findings = await handleBlock(blockEvent);

    const expectedFindings = createFinding(TEST_VAL1.ARB_ESCROW_VAL, TEST_VAL1.ARB_L2_val, "Arbitrum");

    expect(findings.length).toEqual(1);
    expect(findings).toStrictEqual([expectedFindings]);
  });
});
