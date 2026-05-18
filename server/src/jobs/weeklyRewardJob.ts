import { distributeWeeklyRewards } from "../modules/rewards/rewards.service";

/**
 * Production-oriented weekly reward job entry point.
 *
 * This function intentionally does not start an interval or timer. Trigger it
 * from an external scheduler such as Render Cron Job, GitHub Actions, or
 * another trusted worker scheduler.
 */
export async function runWeeklyRewardDistributionJob() {
  return distributeWeeklyRewards();
}
