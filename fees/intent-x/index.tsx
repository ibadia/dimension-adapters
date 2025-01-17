import request, { gql } from "graphql-request";
import { CHAIN } from "../../helpers/chains";
import BigNumber from "bignumber.js";
import { getUniqStartOfTodayTimestamp } from "../../helpers/getUniSubgraphVolume";
import { FetchResultFees, SimpleAdapter } from "../../adapters/types";

const ONE_DAY_IN_SECONDS = 60 * 60 * 24;

const endpoint = "https://api.thegraph.com/subgraphs/name/intent-x/perpetuals-analytics_base";

const query = gql`
  query stats($from: String!, $to: String!) {
    dailyHistories(
      where: { timestamp_gte: $from, timestamp_lte: $to, accountSource: "0x724796d2e9143920B1b58651B04e1Ed201b8cC98" }
    ) {
      timestamp
      platformFee
      accountSource
      tradeVolume
    }
    totalHistories(where: { accountSource: "0x724796d2e9143920B1b58651B04e1Ed201b8cC98" }) {
      timestamp
      platformFee
      accountSource
      tradeVolume
    }
  }
`;

interface IGraphResponse {
  dailyHistories: Array<{
    tiemstamp: string;
    platformFee: string;
    accountSource: string;
    tradeVolume: string;
  }>;
  totalHistories: Array<{
    tiemstamp: string;
    platformFee: string;
    accountSource: string;
    tradeVolume: BigNumber;
  }>;
}

const toString = (x: BigNumber) => {
  if (x.isEqualTo(0)) return undefined;
  return x.toString();
};

const fetchVolume = async (timestamp: number): Promise<FetchResultFees> => {
  const response: IGraphResponse = await request(endpoint, query, {
    from: String(timestamp - ONE_DAY_IN_SECONDS),
    to: String(timestamp),
  });

  let dailyFees = new BigNumber(0);
  response.dailyHistories.forEach((data) => {
    dailyFees = dailyFees.plus(new BigNumber(data.platformFee));
  });

  let totalFees = new BigNumber(0);
  response.totalHistories.forEach((data) => {
    totalFees = totalFees.plus(new BigNumber(data.platformFee));
  });

  dailyFees = dailyFees.dividedBy(new BigNumber(1e18));
  totalFees = totalFees.dividedBy(new BigNumber(1e18));

  const _dailyFees = toString(dailyFees);
  const _totalFees = toString(totalFees);

  const dailyUserFees = _dailyFees;
  const dailyRevenue = _dailyFees;
  const dailyProtocolRevenue = "0";
  const dailyHoldersRevenue = _dailyFees;
  const dailySupplySideRevenue = "0";

  const totalUserFees = _totalFees;
  const totalRevenue = _totalFees;
  const totalProtocolRevenue = "0";
  const totalSupplySideRevenue = "0";

  const dayTimestamp = getUniqStartOfTodayTimestamp(new Date(timestamp * 1000));

  return {
    timestamp: dayTimestamp,

    dailyFees: _dailyFees ?? "0",
    totalFees: _totalFees ?? "0",

    dailyUserFees: dailyUserFees ?? "0",
    dailyRevenue: dailyRevenue ?? "0",
    dailyProtocolRevenue: dailyProtocolRevenue ?? "0",
    dailyHoldersRevenue: dailyHoldersRevenue ?? "0",
    dailySupplySideRevenue: dailySupplySideRevenue ?? "0",
    totalUserFees: totalUserFees ?? "0",
    totalRevenue: totalRevenue ?? "0",
    totalProtocolRevenue: totalProtocolRevenue ?? "0",
    totalSupplySideRevenue: totalSupplySideRevenue ?? "0",
  };
};

const adapter: SimpleAdapter = {
  adapter: {
    [CHAIN.BASE]: {
      fetch: fetchVolume,
      start: async () => 1698796800,
    },
  },
};
export default adapter;
