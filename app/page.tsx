// app/page.tsx  ← FINAL VERSION THAT WORKS ON VERCEL
import { AlertFeed } from '@/components/AlertFeed'
import { Header } from '@/components/Header'

// These three lines are the magic that kills the prerender error forever
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export default function Home() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4">PolyWhale</h1>
            <p className="text-xl text-muted-foreground">
              Real-time Polymarket whale tracker
            </p>
          </div>
          <AlertFeed />
        </div>
      </main>
    </>
  )
}