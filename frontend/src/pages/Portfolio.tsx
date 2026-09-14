import { PortfolioSummaryCards } from "@/components/portfolio/PortfolioSummaryCards";
import { HoldingsTable } from "@/components/portfolio/HoldingsTable";

const Portfolio = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Portfolio</h1>
        <p className="text-muted-foreground">
          View your complete stock holdings and performance
        </p>
      </div>

      <PortfolioSummaryCards />
      <HoldingsTable />
    </div>
  );
};

export default Portfolio;
