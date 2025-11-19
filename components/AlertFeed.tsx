'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { AlertCard } from './AlertCard'
import { Toggle } from '@/components/ui/toggle'
import { Skeleton } from '@/components/ui/skeleton'

export function AlertFeed() {
  const [alerts, setAlerts] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [excludeNoise, setExcludeNoise] = useState(true)

  const isNoise = (title: string) => {
    const l = title.toLowerCase()
    return (
      l.includes('bitcoin') || l.includes('eth') || l.includes('monad') ||
      l.includes('solana') || l.includes('crypto') || l.includes('airdrop') ||
      l.includes('fdv') || l.includes('nba') || l.includes('nfl') ||
      l.includes('lakers') || l.includes('chiefs') || l.includes('uruguay') ||
      l.includes('soccer') || l.includes('win on 20')
    )
  }

  useEffect(() => {
    const fetchAlerts = async () => {
      const { data } = await supabase.rpc('get_public_aggregated_trades', {
        time_range_hours: 72,
        min_volume: 5000
      })
      if (data) setAlerts(data)
      setLoading(false)
    }

    fetchAlerts()

    const channel = supabase
      .channel('trades')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'trades' }, fetchAlerts)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  useEffect(() => {
    setFiltered(excludeNoise ? alerts.filter(a => !isNoise(a.market_title)) : alerts)
  }, [alerts, excludeNoise])

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <Toggle
          pressed={excludeNoise}
          onPressedChange={setExcludeNoise}
          className="data-[state=on]:bg-red-600"
        >
          Exclude Crypto & Sports
        </Toggle>
        <span className="text-sm text-muted-foreground">
          {filtered.length} signals
        </span>
      </div>

      {loading ? (
        <div className="space-y-6">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-2xl text-muted-foreground py-20">
          No whale signals right now
        </p>
      ) : (
        <div className="space-y-6">
          {filtered.map((alert) => (
            <AlertCard key={`${alert.condition_id}-${alert.outcome}`} alert={alert} />
          ))}
        </div>
      )}
    </div>
  )
}