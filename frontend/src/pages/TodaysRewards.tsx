import { TodaysRewardsTable } from "@/components/rewards/TodaysRewardsTable";

const TodaysRewards = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Today's Rewards</h1>
        <p className="text-muted-foreground">
          View and export all rewards received today
        </p>
      </div>

      <TodaysRewardsTable />
    </div>
  );
};

export default TodaysRewards;
