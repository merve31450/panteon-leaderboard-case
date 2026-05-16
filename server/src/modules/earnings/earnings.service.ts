export type EarningResult = {
  playerId: string;
  earningAmount: number;
  prizePoolContribution: number;
  netAmount: number;
};

export function createEarning(playerId: string, amount: number): EarningResult {
  const prizePoolContribution = Number((amount * 0.02).toFixed(2));
  const netAmount = Number((amount - prizePoolContribution).toFixed(2));

  return {
    playerId,
    earningAmount: amount,
    prizePoolContribution,
    netAmount
  };
}