'use client'

import { useState } from 'react'
import { Card, CardHeader, CardContent } from '@/components/shared'
import { Badge } from '@/components/shared/Badge'
import { Button } from '@/components/shared/Button'
import {
  Settings,
  Palette,
  Bell,
  Key,
  User,
  Shield,
  Database,
  Download,
  Upload,
  Trash2,
  Moon,
  Sun,
  Monitor,
  Check,
} from 'lucide-react'

type SettingsTab = 'profile' | 'appearance' | 'notifications' | 'trading' | 'data'

export function SettingsView() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('dark')
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    trading: true,
    fitness: true,
    tcas: true,
    family: true,
  })
  const [tradingSettings, setTradingSettings] = useState({
    maxTrades: 3,
    dailyLossLimit: 500,
    cooldownMinutes: 30,
    requirePreSession: true,
  })

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'appearance' as const, label: 'Appearance', icon: Palette },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'trading' as const, label: 'Trading', icon: Shield },
    { id: 'data' as const, label: 'Data', icon: Database },
  ]

  const handleNotificationToggle = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Settings className="text-purple-400" />
            Settings
          </h1>
          <p className="text-gray-400">Configure your War Room experience</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-2">
                <nav className="space-y-1">
                  {tabs.map((tab) => {
                    const Icon = tab.icon
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                          activeTab === tab.id
                            ? 'bg-purple-500/20 text-purple-400'
                            : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                        }`}
                      >
                        <Icon size={18} />
                        <span className="font-medium">{tab.label}</span>
                      </button>
                    )
                  })}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Profile Settings */}
            {activeTab === 'profile' && (
              <Card>
                <CardHeader title="Profile Settings" icon={<User size={20} />} />
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Display Name
                      </label>
                      <input
                        type="text"
                        defaultValue="Andrew Becker"
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        defaultValue="andrew@example.com"
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Timezone
                      </label>
                      <select className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500">
                        <option value="America/Chicago">Central Time (CT)</option>
                        <option value="America/New_York">Eastern Time (ET)</option>
                        <option value="America/Los_Angeles">Pacific Time (PT)</option>
                        <option value="America/Denver">Mountain Time (MT)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Trading Goal
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">$</span>
                        <input
                          type="number"
                          defaultValue={170000}
                          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>
                    <div className="pt-4">
                      <Button variant="primary">Save Changes</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Appearance Settings */}
            {activeTab === 'appearance' && (
              <Card>
                <CardHeader title="Appearance" icon={<Palette size={20} />} />
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-3">
                        Theme
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { id: 'dark', label: 'Dark', icon: Moon },
                          { id: 'light', label: 'Light', icon: Sun },
                          { id: 'system', label: 'System', icon: Monitor },
                        ].map((option) => {
                          const Icon = option.icon
                          return (
                            <button
                              key={option.id}
                              onClick={() => setTheme(option.id as typeof theme)}
                              className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                                theme === option.id
                                  ? 'border-purple-500 bg-purple-500/10'
                                  : 'border-gray-700 hover:border-gray-600'
                              }`}
                            >
                              <Icon size={24} className={theme === option.id ? 'text-purple-400' : 'text-gray-400'} />
                              <span className={theme === option.id ? 'text-white' : 'text-gray-400'}>
                                {option.label}
                              </span>
                              {theme === option.id && (
                                <Check size={16} className="text-purple-400" />
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-3">
                        Accent Color
                      </label>
                      <div className="flex gap-3">
                        {['purple', 'blue', 'green', 'pink', 'orange'].map((color) => (
                          <button
                            key={color}
                            className={`w-10 h-10 rounded-full bg-${color}-500 border-2 ${
                              color === 'purple' ? 'border-white' : 'border-transparent'
                            } hover:scale-110 transition-transform`}
                            style={{ backgroundColor: `var(--${color}-500, ${color})` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notification Settings */}
            {activeTab === 'notifications' && (
              <Card>
                <CardHeader title="Notifications" icon={<Bell size={20} />} />
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { key: 'email', label: 'Email Notifications', description: 'Receive updates via email' },
                      { key: 'push', label: 'Push Notifications', description: 'Browser push notifications' },
                      { key: 'trading', label: 'Trading Alerts', description: 'Price alerts and trading reminders' },
                      { key: 'fitness', label: 'Fitness Reminders', description: 'Workout and supplement reminders' },
                      { key: 'tcas', label: 'TCAS Updates', description: 'Pipeline and customer notifications' },
                      { key: 'family', label: 'Family Events', description: 'Calendar and property reminders' },
                    ].map((item) => (
                      <div
                        key={item.key}
                        className="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-white">{item.label}</p>
                          <p className="text-sm text-gray-500">{item.description}</p>
                        </div>
                        <button
                          onClick={() => handleNotificationToggle(item.key as keyof typeof notifications)}
                          className={`w-12 h-6 rounded-full transition-colors relative ${
                            notifications[item.key as keyof typeof notifications]
                              ? 'bg-purple-500'
                              : 'bg-gray-600'
                          }`}
                        >
                          <span
                            className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                              notifications[item.key as keyof typeof notifications]
                                ? 'translate-x-7'
                                : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Trading Settings */}
            {activeTab === 'trading' && (
              <Card>
                <CardHeader title="Trading Rules" icon={<Shield size={20} />} />
                <CardContent>
                  <div className="space-y-6">
                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                      <p className="text-yellow-400 text-sm">
                        These rules are enforced by Nova to protect your trading capital.
                        Changing them requires careful consideration.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Maximum Trades Per Day
                      </label>
                      <input
                        type="number"
                        value={tradingSettings.maxTrades}
                        onChange={(e) => setTradingSettings(prev => ({ ...prev, maxTrades: parseInt(e.target.value) || 0 }))}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Daily Loss Limit ($)
                      </label>
                      <input
                        type="number"
                        value={tradingSettings.dailyLossLimit}
                        onChange={(e) => setTradingSettings(prev => ({ ...prev, dailyLossLimit: parseInt(e.target.value) || 0 }))}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Cooldown After 2 Losses (minutes)
                      </label>
                      <input
                        type="number"
                        value={tradingSettings.cooldownMinutes}
                        onChange={(e) => setTradingSettings(prev => ({ ...prev, cooldownMinutes: parseInt(e.target.value) || 0 }))}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                      <div>
                        <p className="font-medium text-white">Require Pre-Session Checklist</p>
                        <p className="text-sm text-gray-500">Must complete checklist before trading</p>
                      </div>
                      <button
                        onClick={() => setTradingSettings(prev => ({ ...prev, requirePreSession: !prev.requirePreSession }))}
                        className={`w-12 h-6 rounded-full transition-colors relative ${
                          tradingSettings.requirePreSession ? 'bg-purple-500' : 'bg-gray-600'
                        }`}
                      >
                        <span
                          className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                            tradingSettings.requirePreSession ? 'translate-x-7' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="pt-4">
                      <Button variant="primary">Save Trading Rules</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Data Settings */}
            {activeTab === 'data' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader title="Export Data" icon={<Download size={20} />} />
                  <CardContent>
                    <p className="text-gray-400 mb-4">
                      Download all your data in JSON format for backup or migration.
                    </p>
                    <div className="flex gap-3">
                      <Button variant="secondary" icon={<Download size={16} />}>
                        Export All Data
                      </Button>
                      <Button variant="ghost" icon={<Download size={16} />}>
                        Export Trades Only
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader title="Import Data" icon={<Upload size={20} />} />
                  <CardContent>
                    <p className="text-gray-400 mb-4">
                      Import data from a previous export or migration.
                    </p>
                    <Button variant="secondary" icon={<Upload size={16} />}>
                      Import Data
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader title="Danger Zone" icon={<Trash2 size={20} />} />
                  <CardContent>
                    <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <p className="text-red-400 text-sm mb-4">
                        These actions are irreversible. Please be certain before proceeding.
                      </p>
                      <div className="flex gap-3">
                        <Button variant="danger">
                          Clear All Trade History
                        </Button>
                        <Button variant="danger">
                          Delete Account
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
