'use client'

import { Card, CardHeader, CardContent } from '@/components/shared'
import { Badge } from '@/components/shared/Badge'
import { Button } from '@/components/shared/Button'
import {
  Wallet,
  TrendingUp,
  PiggyBank,
  CreditCard,
  Building,
  DollarSign,
  ArrowUpRight,
  Target,
  Plus,
  Loader2,
} from 'lucide-react'
import { useWealth } from '@/hooks/useWealth'

export function WealthView() {
  const {
    accounts,
    goals,
    incomeStreams,
    stats,
    loading,
  } = useWealth()

  // Separate assets from debts
  const assets = accounts.filter(a => !a.is_debt)
  const debts = accounts.filter(a => a.is_debt)

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Wallet className="text-purple-400" />
            Wealth Command
          </h1>
          <p className="text-gray-400">Track your path to financial freedom</p>
        </div>

        {/* Net Worth Card */}
        <Card variant="glow" className="mb-6">
          <CardContent>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-sm text-gray-400 mb-1">Net Worth</p>
                <p className="text-4xl font-bold text-white">
                  ${stats.netWorth.toLocaleString()}
                </p>
                <p className="text-sm text-green-400 flex items-center gap-1 mt-1">
                  <ArrowUpRight size={14} />
                  +$12,450 (+2.6%) this month
                </p>
              </div>
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-400">
                    ${(stats.totalAssets / 1000).toFixed(0)}K
                  </p>
                  <p className="text-xs text-gray-500">Total Assets</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-400">
                    ${(stats.totalDebts / 1000).toFixed(0)}K
                  </p>
                  <p className="text-xs text-gray-500">Total Debts</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-400">
                    {stats.savingsRate.toFixed(0)}%
                  </p>
                  <p className="text-xs text-gray-500">Savings Rate</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Accounts */}
          <div className="lg:col-span-2 space-y-6">
            {/* Assets */}
            <Card>
              <CardHeader
                title="Assets"
                subtitle={`$${stats.totalAssets.toLocaleString()} total`}
                icon={<TrendingUp size={20} />}
                action={<Button size="sm" variant="ghost" icon={<Plus size={14} />}>Add</Button>}
              />
              <CardContent>
                {assets.length > 0 ? (
                  <div className="space-y-3">
                    {assets.map((account) => (
                      <div
                        key={account.id}
                        className="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${getAccountColor(account.type)}`}>
                            {getAccountIcon(account.type)}
                          </div>
                          <div>
                            <p className="font-medium text-white">{account.name}</p>
                            <p className="text-xs text-gray-500">{account.institution || ''}</p>
                          </div>
                        </div>
                        <p className="font-semibold text-white">
                          ${account.balance.toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Wallet className="w-12 h-12 mx-auto text-gray-600 mb-3" />
                    <p className="text-gray-400 mb-4">No accounts yet</p>
                    <Button size="sm" icon={<Plus size={14} />}>Add your first account</Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Debts */}
            <Card>
              <CardHeader
                title="Debts"
                subtitle={`$${stats.totalDebts.toLocaleString()} total`}
                icon={<CreditCard size={20} />}
              />
              <CardContent>
                {debts.length > 0 ? (
                  <div className="space-y-3">
                    {debts.map((debt) => (
                      <div
                        key={debt.id}
                        className="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-red-500/20 text-red-400">
                            <Building size={18} />
                          </div>
                          <div>
                            <p className="font-medium text-white">{debt.name}</p>
                            <p className="text-xs text-gray-500">{debt.institution || ''}</p>
                          </div>
                        </div>
                        <p className="font-semibold text-red-400">
                          ${Math.abs(debt.balance).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-4">Debt-free!</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Income Streams */}
            <Card>
              <CardHeader
                title="Income Streams"
                subtitle={`$${Math.round(stats.monthlyIncome).toLocaleString()}/mo`}
                icon={<DollarSign size={20} />}
              />
              <CardContent>
                {incomeStreams.length > 0 ? (
                  <div className="space-y-3">
                    {incomeStreams.filter(s => s.is_active).map((stream) => (
                      <div
                        key={stream.id}
                        className="flex items-center justify-between p-2 bg-gray-800 rounded-lg"
                      >
                        <div>
                          <p className="text-sm font-medium text-white">{stream.name}</p>
                          <Badge variant="default" size="sm">{stream.type}</Badge>
                        </div>
                        <p className="font-semibold text-green-400">
                          +${stream.amount.toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-4">No income streams tracked</p>
                )}
              </CardContent>
            </Card>

            {/* Financial Goals */}
            <Card>
              <CardHeader
                title="Financial Goals"
                icon={<Target size={20} />}
              />
              <CardContent>
                {goals.length > 0 ? (
                  <div className="space-y-4">
                    {goals.map((goal) => {
                      const target = goal.target_amount || 0
                      const current = goal.current_amount || 0
                      const progress = target > 0 ? (current / target) * 100 : 0
                      return (
                        <div key={goal.id}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-300">{goal.name}</span>
                            <span className="text-white">
                              ${(current / 1000).toFixed(0)}K / ${(target / 1000).toFixed(0)}K
                            </span>
                          </div>
                          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{progress.toFixed(0)}% complete</p>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-4">No goals set</p>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader title="Quick Actions" />
              <CardContent>
                <div className="space-y-2">
                  <Button variant="secondary" fullWidth size="sm">
                    Log Transaction
                  </Button>
                  <Button variant="secondary" fullWidth size="sm">
                    Update Balances
                  </Button>
                  <Button variant="secondary" fullWidth size="sm">
                    View Reports
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

function getAccountColor(type: string): string {
  const colors: Record<string, string> = {
    checking: 'bg-blue-500/20 text-blue-400',
    savings: 'bg-green-500/20 text-green-400',
    investment: 'bg-purple-500/20 text-purple-400',
    retirement: 'bg-yellow-500/20 text-yellow-400',
    crypto: 'bg-orange-500/20 text-orange-400',
    real_estate: 'bg-cyan-500/20 text-cyan-400',
    other: 'bg-gray-500/20 text-gray-400',
  }
  return colors[type] || colors.other
}

function getAccountIcon(type: string): React.ReactNode {
  switch (type) {
    case 'checking':
      return <Wallet size={18} />
    case 'savings':
      return <PiggyBank size={18} />
    case 'investment':
      return <TrendingUp size={18} />
    case 'retirement':
      return <Target size={18} />
    case 'crypto':
      return <DollarSign size={18} />
    case 'real_estate':
      return <Building size={18} />
    default:
      return <Wallet size={18} />
  }
}
