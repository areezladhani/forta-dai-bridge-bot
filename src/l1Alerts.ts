import { getAlerts } from "forta-agent";

// we specify the block number and return only one alert as we are checking the condition
// once every block so there should be one l1 escrow supply alert per block

export const getL1Alerts = async (blockNumber: number) => {
  return await getAlerts({
    botIds: ["0x85eec705f35994643c0497a7764c54a808b1333007fccd26b7f8dcf6078cf315"],
    alertId: "l1-escrow-supply",
    first: 1,
    blockNumberRange: {
      startBlockNumber: blockNumber,
      endBlockNumber: blockNumber,
    },
  });
};
