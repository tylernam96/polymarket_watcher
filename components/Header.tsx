import { Mountain } from 'lucide-react'

export function Header() {
  return (
    <header className="border-b">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Mountain className="w-8 h-8" />
          <span className="text-2xl font-bold">PolyWhale</span>
        </div>
        <span className="text-sm text-muted-foreground">
          Live • Updated every 30min
        </span>
      </div>
    </header>
  )
}