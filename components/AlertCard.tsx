import { Card, CardContent } from '@/components/ui/card'
import { ExternalLink } from 'lucide-react'

export function AlertCard({ alert }: { alert: any }) {
  const volume = alert.buy_usd || alert.total_volume || 0
  const avg = alert.avg_buy_price || 0.5

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex justify-between items-start gap-6">
          <div className="flex-1">
            <a href={alert.market_url} target="_blank" rel="noopener noreferrer">
              <h3 className="text-2xl font-bold hover:underline">
                {alert.market_title}
              </h3>
            </a>
            <p className="text-xl font-medium text-primary mt-1">
              {alert.outcome}
            </p>

            <div className="mt-4 flex items-center gap-6 text-muted-foreground">
              <span className="text-3xl font-bold text-foreground">
                ${Math.round(volume).toLocaleString()}
              </span>
              <span>avg ${(avg).toFixed(3)}</span>
              <span>{alert.unique_traders} whale{alert.unique_traders !== 1 ? 's' : ''}</span>
            </div>
          </div>

          <a href={alert.market_url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-5 h-5 text-muted-foreground hover:text-foreground" />
          </a>
        </div>
      </CardContent>
    </Card>
  )
}