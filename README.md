# MakerDao Bridge Invariant Bot

## Description

This bot detects insolvency on the makerDao optimism and arbitrum layer 1 escrows.

## Supported Chains

- Ethereum
- Arbitrum
- Optimism

## Alerts

- l1-escrow-supply

  - Fired with MakerDao L1 Arbitrum and Optimism escrow balances each time a new block is mined.
  - Severity is always set to "Info".
  - Type is always set to "info".
  - Metadata: {
    optEscrBal: balance of the MakerDao Optimism escrow on Ethereum.
    arbEscrBal: balance of the MakerDao Arbitrum escrow on Ethereum.
    }

- L1 Optimism/Arbitrum escrow insolvent.
  - Fired when the l1 escrow balance is less then the l2 token total supply.
  - Severity is always set to "critical".
  - Type is always set to "exploit".
  - Metadata: {
    l1Escrow: balance of the Opt/Arb l1 escrow balance.
    L2supply: total supply of the Opt/Arb l2 token.
    }

## Test Data

The agent behaviour can be verified with the following transactions:

- This bot can be tested when deployed on the following networks:

  - Ethereum

    - chainId: 1
    - Eth will be the default set network when testing.

  - Optimism

    - chainId: 10
    - Add the code below to the forta.config.json file to test.
      - "jsonRpcUrl": "https://rpc.ankr.com/optimism";

  - Arbitrum

    - chainId: 42161
    - Add the code below to the forta.config.json file to test.
      - "jsonRpcUrl": "https://rpc.ankr.com/arbitrum";
