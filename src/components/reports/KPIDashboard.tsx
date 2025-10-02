import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, Percent, Activity } from 'lucide-react';
import { CompanyType } from '@/types/settings';

interface KPICardProps {
  title: string;
  current: number;
  prior: number;
  format: 'currency' | 'percentage' | 'ratio';
  currencySymbol: string;
  onClick?: () => void;
  isClickable?: boolean;
}

const KPICard = ({ title, current, prior, format, currencySymbol, onClick, isClickable }: KPICardProps) => {
  const change = current - prior;
  const percentChange = prior !== 0 ? ((change / prior) * 100) : 0;
  const isPositive = change >= 0;

  const formatValue = (value: number) => {
    if (format === 'currency') {
      return `${currencySymbol}${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else if (format === 'percentage') {
      return `${value.toFixed(2)}%`;
    } else {
      return value.toFixed(2);
    }
  };

  return (
    <Card 
      className={`hover:shadow-lg transition-shadow ${isClickable ? 'cursor-pointer hover:border-primary' : ''}`}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {format === 'currency' ? (
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        ) : format === 'percentage' ? (
          <Percent className="h-4 w-4 text-muted-foreground" />
        ) : (
          <Activity className="h-4 w-4 text-muted-foreground" />
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatValue(current)}</div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
          <span>Prior: {formatValue(prior)}</span>
        </div>
        <div className={`flex items-center gap-1 text-xs mt-2 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {isPositive ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          <span>{percentChange > 0 ? '+' : ''}{percentChange.toFixed(1)}% vs prior</span>
        </div>
      </CardContent>
    </Card>
  );
};

interface KPIDashboardProps {
  kpis: {
    current: {
      revenue: number;
      netIncome: number;
      grossMargin: number;
      netProfitMargin: number;
      accountsReceivable: number;
      accountsPayable: number;
      inventory?: number;
      currentRatio: number;
      quickRatio: number;
      workingCapital: number;
      debtToEquity: number;
      debtRatio: number;
      roa: number;
      roe: number;
      assetTurnover: number;
    };
    prior: {
      revenue: number;
      netIncome: number;
      grossMargin: number;
      netProfitMargin: number;
      accountsReceivable: number;
      accountsPayable: number;
      inventory?: number;
      currentRatio: number;
      quickRatio: number;
      workingCapital: number;
      debtToEquity: number;
      debtRatio: number;
      roa: number;
      roe: number;
      assetTurnover: number;
    };
  };
  currencySymbol: string;
  companyType: CompanyType;
  onKPIClick?: (kpiType: string) => void;
}

export const KPIDashboard = ({ kpis, currencySymbol, companyType, onKPIClick }: KPIDashboardProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Financial Performance</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <KPICard
            title="Total Revenue"
            current={kpis.current.revenue}
            prior={kpis.prior.revenue}
            format="currency"
            currencySymbol={currencySymbol}
            onClick={() => onKPIClick?.('revenue')}
            isClickable={!!onKPIClick}
          />
          <KPICard
            title="Net Income"
            current={kpis.current.netIncome}
            prior={kpis.prior.netIncome}
            format="currency"
            currencySymbol={currencySymbol}
            onClick={() => onKPIClick?.('netIncome')}
            isClickable={!!onKPIClick}
          />
          <KPICard
            title="Gross Margin"
            current={kpis.current.grossMargin}
            prior={kpis.prior.grossMargin}
            format="percentage"
            currencySymbol={currencySymbol}
            onClick={() => onKPIClick?.('grossMargin')}
            isClickable={!!onKPIClick}
          />
          <KPICard
            title="Net Profit Margin"
            current={kpis.current.netProfitMargin}
            prior={kpis.prior.netProfitMargin}
            format="percentage"
            currencySymbol={currencySymbol}
            onClick={() => onKPIClick?.('netProfitMargin')}
            isClickable={!!onKPIClick}
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Balance Sheet Items</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <KPICard
            title="Accounts Receivable"
            current={kpis.current.accountsReceivable}
            prior={kpis.prior.accountsReceivable}
            format="currency"
            currencySymbol={currencySymbol}
            onClick={() => onKPIClick?.('accountsReceivable')}
            isClickable={!!onKPIClick}
          />
          <KPICard
            title="Accounts Payable"
            current={kpis.current.accountsPayable}
            prior={kpis.prior.accountsPayable}
            format="currency"
            currencySymbol={currencySymbol}
            onClick={() => onKPIClick?.('accountsPayable')}
            isClickable={!!onKPIClick}
          />
          {(companyType === 'trading' || companyType === 'manufacturer') && kpis.current.inventory !== undefined && (
            <KPICard
              title="Inventory"
              current={kpis.current.inventory}
              prior={kpis.prior.inventory || 0}
              format="currency"
              currencySymbol={currencySymbol}
              onClick={() => onKPIClick?.('inventory')}
              isClickable={!!onKPIClick}
            />
          )}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Liquidity & Solvency</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <KPICard
            title="Current Ratio"
            current={kpis.current.currentRatio}
            prior={kpis.prior.currentRatio}
            format="ratio"
            currencySymbol={currencySymbol}
            onClick={() => onKPIClick?.('currentRatio')}
            isClickable={!!onKPIClick}
          />
          <KPICard
            title="Quick Ratio"
            current={kpis.current.quickRatio}
            prior={kpis.prior.quickRatio}
            format="ratio"
            currencySymbol={currencySymbol}
            onClick={() => onKPIClick?.('quickRatio')}
            isClickable={!!onKPIClick}
          />
          <KPICard
            title="Working Capital"
            current={kpis.current.workingCapital}
            prior={kpis.prior.workingCapital}
            format="currency"
            currencySymbol={currencySymbol}
            onClick={() => onKPIClick?.('workingCapital')}
            isClickable={!!onKPIClick}
          />
          <KPICard
            title="Debt to Equity"
            current={kpis.current.debtToEquity}
            prior={kpis.prior.debtToEquity}
            format="ratio"
            currencySymbol={currencySymbol}
            onClick={() => onKPIClick?.('debtToEquity')}
            isClickable={!!onKPIClick}
          />
          <KPICard
            title="Debt Ratio"
            current={kpis.current.debtRatio}
            prior={kpis.prior.debtRatio}
            format="percentage"
            currencySymbol={currencySymbol}
            onClick={() => onKPIClick?.('debtRatio')}
            isClickable={!!onKPIClick}
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Profitability Ratios</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <KPICard
            title="Return on Assets (ROA)"
            current={kpis.current.roa}
            prior={kpis.prior.roa}
            format="percentage"
            currencySymbol={currencySymbol}
            onClick={() => onKPIClick?.('roa')}
            isClickable={!!onKPIClick}
          />
          <KPICard
            title="Return on Equity (ROE)"
            current={kpis.current.roe}
            prior={kpis.prior.roe}
            format="percentage"
            currencySymbol={currencySymbol}
            onClick={() => onKPIClick?.('roe')}
            isClickable={!!onKPIClick}
          />
          <KPICard
            title="Asset Turnover"
            current={kpis.current.assetTurnover}
            prior={kpis.prior.assetTurnover}
            format="ratio"
            currencySymbol={currencySymbol}
            onClick={() => onKPIClick?.('assetTurnover')}
            isClickable={!!onKPIClick}
          />
        </div>
      </div>
    </div>
  );
};
