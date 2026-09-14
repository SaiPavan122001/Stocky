import { ClaimRewardForm } from "@/components/rewards/ClaimRewardForm";
import { RewardHistoryTable } from "@/components/rewards/RewardHistoryTable";

const Rewards = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Claim Rewards</h1>
        <p className="text-muted-foreground">
          Claim your stock rewards and view your history
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ClaimRewardForm />
        <div className="lg:col-span-1">
          <RewardHistoryTable />
        </div>
      </div>
    </div>
  );
};

export default Rewards;
