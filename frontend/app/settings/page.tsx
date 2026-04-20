'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  LucideSettings, 
  LucideSave, 
  LucideRefreshCw,
  LucideBell,
  LucideEye,
  LucideDatabase,
  LucideShield,
  LucidePalette,
  LucideGlobe,
  LucideCpu
} from 'lucide-react'

interface SettingsState {
  detection: {
    confidenceThreshold: number
    exitDelay: number
    minOccupancyDuration: number
  }
  notifications: {
    emailAlerts: boolean
    slackWebhook: string
    alertOnCameraOffline: boolean
    alertOnLongAbsence: boolean
    longAbsenceThreshold: number
  }
  display: {
    theme: 'dark' | 'light' | 'auto'
    refreshRate: number
    showSeatNames: boolean
    showConfidenceScores: boolean
  }
  system: {
    autoStartCameras: boolean
    logRetentionDays: number
    maxConcurrentStreams: number
  }
}

const defaultSettings: SettingsState = {
  detection: {
    confidenceThreshold: 0.3,
    exitDelay: 5,
    minOccupancyDuration: 2
  },
  notifications: {
    emailAlerts: true,
    slackWebhook: '',
    alertOnCameraOffline: true,
    alertOnLongAbsence: true,
    longAbsenceThreshold: 120
  },
  display: {
    theme: 'dark',
    refreshRate: 5,
    showSeatNames: true,
    showConfidenceScores: false
  },
  system: {
    autoStartCameras: true,
    logRetentionDays: 30,
    maxConcurrentStreams: 4
  }
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsState>(defaultSettings)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState<'detection' | 'notifications' | 'display' | 'system'>('detection')

  useEffect(() => {
    // Load saved settings from localStorage
    const saved = localStorage.getItem('wst_settings')
    if (saved) {
      try {
        setSettings(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to parse settings')
      }
    }
  }, [])

  const handleSave = async () => {
    setSaving(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800))
    localStorage.setItem('wst_settings', JSON.stringify(settings))
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleReset = () => {
    if (confirm('Reset all settings to default?')) {
      setSettings(defaultSettings)
      localStorage.removeItem('wst_settings')
    }
  }

  const tabs = [
    { id: 'detection', label: 'Detection', icon: LucideEye },
    { id: 'notifications', label: 'Notifications', icon: LucideBell },
    { id: 'display', label: 'Display', icon: LucidePalette },
    { id: 'system', label: 'System', icon: LucideCpu },
  ]

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card surface-3d p-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
      >
        <div className="flex items-center gap-4">
          <div className="surface-3d p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/20 rounded-2xl shadow-lg shadow-purple-500/10">
            <LucideSettings className="text-purple-400" size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-outfit font-bold tracking-tight">Settings</h2>
            <p className="text-sm text-zinc-400 mt-1">Configure system behavior and preferences</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="btn-secondary flex items-center gap-2"
          >
            <LucideRefreshCw size={16} />
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex items-center gap-2"
          >
            {saving ? (
              <LucideRefreshCw size={16} className="animate-spin" />
            ) : (
              <LucideSave size={16} />
            )}
            {saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </motion.div>

      {/* Settings Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Tabs */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1"
        >
          <div className="glass-card surface-3d p-4 flex flex-col gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  activeTab === tab.id
                    ? 'bg-purple-500/20 border border-purple-500/30 text-white'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <tab.icon size={18} />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* System Info Card */}
          <div className="glass-card surface-3d p-4 mt-4">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <LucideDatabase size={16} className="text-zinc-500" />
              System Info
            </h4>
            <div className="space-y-2 text-xs text-zinc-500">
              <div className="flex justify-between">
                <span>Version</span>
                <span className="text-zinc-300">v2.0.0</span>
              </div>
              <div className="flex justify-between">
                <span>YOLO Model</span>
                <span className="text-zinc-300">YOLOv8n</span>
              </div>
              <div className="flex justify-between">
                <span>Backend</span>
                <span className="text-zinc-300">FastAPI</span>
              </div>
              <div className="flex justify-between">
                <span>Database</span>
                <span className="text-zinc-300">SQLite</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Settings Content */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-3"
        >
          <div className="glass-card surface-3d p-6">
            {/* Detection Settings */}
            {activeTab === 'detection' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Detection Settings</h3>
                  <p className="text-sm text-zinc-500">Configure how the AI detects and tracks occupancy</p>
                </div>

                <SettingRow
                  label="Confidence Threshold"
                  description="Minimum confidence score for person detection (0.0 - 1.0)"
                >
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="0.1"
                      max="0.9"
                      step="0.1"
                      value={settings.detection.confidenceThreshold}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        detection: { ...prev.detection, confidenceThreshold: parseFloat(e.target.value) }
                      }))}
                      className="flex-1 accent-purple-500"
                    />
                    <span className="w-12 text-right font-mono text-sm">
                      {settings.detection.confidenceThreshold.toFixed(1)}
                    </span>
                  </div>
                </SettingRow>

                <SettingRow
                  label="Exit Delay"
                  description="Seconds to wait before marking a seat as vacant"
                >
                  <div className="flex items-center gap-4">
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={settings.detection.exitDelay}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        detection: { ...prev.detection, exitDelay: parseInt(e.target.value) }
                      }))}
                      className="panel-depth w-24 px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-center"
                    />
                    <span className="text-sm text-zinc-500">seconds</span>
                  </div>
                </SettingRow>

                <SettingRow
                  label="Minimum Occupancy Duration"
                  description="Minimum time a person must be detected to count as occupancy"
                >
                  <div className="flex items-center gap-4">
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={settings.detection.minOccupancyDuration}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        detection: { ...prev.detection, minOccupancyDuration: parseInt(e.target.value) }
                      }))}
                      className="panel-depth w-24 px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-center"
                    />
                    <span className="text-sm text-zinc-500">seconds</span>
                  </div>
                </SettingRow>
              </div>
            )}

            {/* Notification Settings */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Notification Settings</h3>
                  <p className="text-sm text-zinc-500">Configure alerts and webhook integrations</p>
                </div>

                <SettingRow
                  label="Email Alerts"
                  description="Send email notifications for critical events"
                >
                  <button
                    onClick={() => setSettings(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, emailAlerts: !prev.notifications.emailAlerts }
                    }))}
                    className={`w-14 h-7 rounded-full transition-colors relative ${
                      settings.notifications.emailAlerts ? 'bg-purple-500' : 'bg-zinc-700'
                    }`}
                  >
                    <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${
                      settings.notifications.emailAlerts ? 'left-8' : 'left-1'
                    }`} />
                  </button>
                </SettingRow>

                <SettingRow
                  label="Alert on Camera Offline"
                  description="Notify when a camera stream becomes unavailable"
                >
                  <button
                    onClick={() => setSettings(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, alertOnCameraOffline: !prev.notifications.alertOnCameraOffline }
                    }))}
                    className={`w-14 h-7 rounded-full transition-colors relative ${
                      settings.notifications.alertOnCameraOffline ? 'bg-purple-500' : 'bg-zinc-700'
                    }`}
                  >
                    <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${
                      settings.notifications.alertOnCameraOffline ? 'left-8' : 'left-1'
                    }`} />
                  </button>
                </SettingRow>

                <SettingRow
                  label="Alert on Long Absence"
                  description="Notify when a seat is idle during work hours"
                >
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setSettings(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, alertOnLongAbsence: !prev.notifications.alertOnLongAbsence }
                      }))}
                      className={`w-14 h-7 rounded-full transition-colors relative ${
                        settings.notifications.alertOnLongAbsence ? 'bg-purple-500' : 'bg-zinc-700'
                      }`}
                    >
                      <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${
                        settings.notifications.alertOnLongAbsence ? 'left-8' : 'left-1'
                      }`} />
                    </button>
                    {settings.notifications.alertOnLongAbsence && (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="30"
                          max="480"
                          value={settings.notifications.longAbsenceThreshold}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            notifications: { ...prev.notifications, longAbsenceThreshold: parseInt(e.target.value) }
                          }))}
                          className="panel-depth w-20 px-2 py-1 rounded-lg bg-zinc-900 border border-white/10 text-sm text-center"
                        />
                        <span className="text-sm text-zinc-500">min</span>
                      </div>
                    )}
                  </div>
                </SettingRow>

                <SettingRow
                  label="Slack Webhook URL"
                  description="Optional: Send alerts to Slack channel"
                >
                  <input
                    type="text"
                    value={settings.notifications.slackWebhook}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, slackWebhook: e.target.value }
                    }))}
                    placeholder="https://hooks.slack.com/services/..."
                    className="panel-depth w-full max-w-md px-4 py-2 rounded-xl bg-zinc-900 border border-white/10 text-sm"
                  />
                </SettingRow>
              </div>
            )}

            {/* Display Settings */}
            {activeTab === 'display' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Display Settings</h3>
                  <p className="text-sm text-zinc-500">Customize the dashboard appearance</p>
                </div>

                <SettingRow
                  label="Theme"
                  description="Choose your preferred color theme"
                >
                  <select
                    value={settings.display.theme}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      display: { ...prev.display, theme: e.target.value as any }
                    }))}
                    className="panel-depth px-4 py-2 rounded-xl bg-zinc-900 border border-white/10"
                  >
                    <option value="dark">Dark</option>
                    <option value="light">Light</option>
                    <option value="auto">Auto</option>
                  </select>
                </SettingRow>

                <SettingRow
                  label="Dashboard Refresh Rate"
                  description="How often to refresh live data"
                >
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="1"
                      max="60"
                      step="1"
                      value={settings.display.refreshRate}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        display: { ...prev.display, refreshRate: parseInt(e.target.value) }
                      }))}
                      className="flex-1 accent-purple-500"
                    />
                    <span className="w-16 text-right font-mono text-sm">
                      {settings.display.refreshRate}s
                    </span>
                  </div>
                </SettingRow>

                <SettingRow
                  label="Show Seat Names"
                  description="Display seat identifiers on the floor map"
                >
                  <button
                    onClick={() => setSettings(prev => ({
                      ...prev,
                      display: { ...prev.display, showSeatNames: !prev.display.showSeatNames }
                    }))}
                    className={`w-14 h-7 rounded-full transition-colors relative ${
                      settings.display.showSeatNames ? 'bg-purple-500' : 'bg-zinc-700'
                    }`}
                  >
                    <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${
                      settings.display.showSeatNames ? 'left-8' : 'left-1'
                    }`} />
                  </button>
                </SettingRow>

                <SettingRow
                  label="Show Confidence Scores"
                  description="Display detection confidence percentages"
                >
                  <button
                    onClick={() => setSettings(prev => ({
                      ...prev,
                      display: { ...prev.display, showConfidenceScores: !prev.display.showConfidenceScores }
                    }))}
                    className={`w-14 h-7 rounded-full transition-colors relative ${
                      settings.display.showConfidenceScores ? 'bg-purple-500' : 'bg-zinc-700'
                    }`}
                  >
                    <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${
                      settings.display.showConfidenceScores ? 'left-8' : 'left-1'
                    }`} />
                  </button>
                </SettingRow>
              </div>
            )}

            {/* System Settings */}
            {activeTab === 'system' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-1">System Settings</h3>
                  <p className="text-sm text-zinc-500">Advanced configuration options</p>
                </div>

                <SettingRow
                  label="Auto-Start Cameras"
                  description="Automatically start camera streams on system startup"
                >
                  <button
                    onClick={() => setSettings(prev => ({
                      ...prev,
                      system: { ...prev.system, autoStartCameras: !prev.system.autoStartCameras }
                    }))}
                    className={`w-14 h-7 rounded-full transition-colors relative ${
                      settings.system.autoStartCameras ? 'bg-purple-500' : 'bg-zinc-700'
                    }`}
                  >
                    <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${
                      settings.system.autoStartCameras ? 'left-8' : 'left-1'
                    }`} />
                  </button>
                </SettingRow>

                <SettingRow
                  label="Log Retention"
                  description="Days to keep occupancy logs before automatic cleanup"
                >
                  <div className="flex items-center gap-4">
                    <input
                      type="number"
                      min="7"
                      max="365"
                      value={settings.system.logRetentionDays}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        system: { ...prev.system, logRetentionDays: parseInt(e.target.value) }
                      }))}
                      className="panel-depth w-24 px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-center"
                    />
                    <span className="text-sm text-zinc-500">days</span>
                  </div>
                </SettingRow>

                <SettingRow
                  label="Max Concurrent Streams"
                  description="Maximum number of cameras to process simultaneously"
                >
                  <div className="flex items-center gap-4">
                    <input
                      type="number"
                      min="1"
                      max="16"
                      value={settings.system.maxConcurrentStreams}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        system: { ...prev.system, maxConcurrentStreams: parseInt(e.target.value) }
                      }))}
                      className="panel-depth w-24 px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-center"
                    />
                    <span className="text-sm text-zinc-500">streams</span>
                  </div>
                </SettingRow>

                <div className="pt-6 border-t border-white/10">
                  <div className="flex items-center gap-2 text-amber-400 mb-4">
                    <LucideShield size={18} />
                    <span className="font-medium text-sm">Danger Zone</span>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm('Clear all occupancy logs? This cannot be undone.')) {
                        alert('Logs cleared (demo)')
                      }
                    }}
                    className="px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 rounded-xl text-sm font-medium border border-rose-500/30 transition-colors"
                  >
                    Clear All Logs
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

function SettingRow({ 
  label, 
  description, 
  children 
}: { 
  label: string
  description: string
  children: React.ReactNode 
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-b border-white/5 last:border-0">
      <div className="flex-1">
        <h4 className="font-medium">{label}</h4>
        <p className="text-sm text-zinc-500 mt-1">{description}</p>
      </div>
      <div className="sm:w-64 flex-shrink-0">
        {children}
      </div>
    </div>
  )
}
