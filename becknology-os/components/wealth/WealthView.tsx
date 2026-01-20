'use client'

import { useState } from 'react'
import { Card, CardHeader, CardContent } from '@/components/shared'
import { Badge } from '@/components/shared/Badge'
import { Button } from '@/components/shared/Button'
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  CreditCard,
  Building,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Plus,
} from 'lucide-react'

export function WealthView() {
  // Mock data - would come from useWealth hook
  const stats = {
    netWorth: 485230,
    totalAssets: 612500,
    totalDebts: 127270,
    monthlyIncome: 18500,
    monthlyExpenses: 8200,
    savingsRate: 55.7,
  }

  const accounts = [
    { name: 'Main Checking', type: 'checking', balance: 15420, institution: 'Chase' },
    { name: 'High Yield Savings', type: 'savings', balance: 45000, institution: 'Marcus' },
    { name: 'Trading Account', type: 'investment', balance: 42850, institution: 'TD Ameritrade' },
    { name: '401(k)', type: 'retirement', balance: 285000, institution: 'Fidelity' },
    { name: 'Roth IRA', type: 'retirement', balance: 78000, institution: 'Vanguard' },
    { name: 'Crypto', type: 'crypto', balance: 24500, institution: 'Coinbase' },
    { name: 'Home Equity', type: 'real_estate', balance: 121730, institution: '' },
  ]

  const debts = [
    { name: 'Mortgage', balance: 127270, rate: 3.25, payment: 1850 },
  ]

  const incomeStreams = [
    { name: 'TCAS Salary', amount: 12000, type: 'salary' },
    { name: 'Trading Profits', amount: 4500, type: 'investment' },
    { name: 'Becknology Consulting', amount: 2000, type: 'business' },
  ]

  const goals = [
    { name: '$170K Trading Goal', target: 170000, current: 42850, category: 'investment' },
    { name: 'Emergency Fund', target: 50000, current: 45000, category: 'savings' },
    { name: 'Becknology Launch', target: 100000, current: 15000, category: 'investment' },
  ]

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
                <div className="space-y-3">
                  {accounts.map((account, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${getAccountColor(account.type)}`}>
                          {getAccountIcon(account.type)}
                        </div>
                        <div>
                          <p className="font-medium text-white">{account.name}</p>
                          <p className="text-xs text-gray-500">{account.institution}</p>
                        </div>
                      </div>
                      <p className="font-semibold text-white">
                        ${account.balance.toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
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
                    {debts.map((debt, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-red-500/20 text-red-400">
                            <Building size={18} />
                          </div>
                          <div>
                            <p className="font-medium text-white">{debt.name}</p>
                            <p className="text-xs text-gray-500">
                              {debt.rate}% APR | ${debt.payment}/mo
                            </p>
                          </div>
                        </div>
                        <p className="font-semibold text-red-400">
                          ${debt.balance.toLocaleString()}
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
                subtitle={`$${stats.monthlyIncome.toLocaleString()}/mo`}
                icon={<DollarSign size={20} />}
              />
              <CardContent>
                <div className="space-y-3">
                  {incomeStreams.map((stream, i) => (
                    <div
                      key={i}
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
              </CardContent>
            </Card>

            {/* Financial Goals */}
            <Card>
              <CardHeader
                title="Financial Goals"
                icon={<Target size={20} />}
              />
              <CardContent>
                <div className="space-y-4">
                  {goals.map((goal, i) => {
                    const progress = (goal.current / goal.target) * 100
                    return (
                      <div key={i}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-300">{goal.name}</span>
                          <span className="text-white">
                            ${(goal.current / 1000).toFixed(0)}K / ${(goal.target / 1000).toFixed(0)}K
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
