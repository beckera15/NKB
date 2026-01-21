'use client'

import { useEffect, useRef } from 'react'

export default function TradingViewTicker() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Clear any existing content
    container.innerHTML = ''

    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js'
    script.async = true
    script.innerHTML = JSON.stringify({
      symbols: [
        { proName: "CME_MINI:NQ1!", title: "NQ" },
        { proName: "CME_MINI:ES1!", title: "ES" },
        { proName: "CBOT_MINI:YM1!", title: "YM" },
        { proName: "CME_MINI:RTY1!", title: "RTY" },
        { proName: "CBOE:VIX", title: "VIX" },
        { proName: "TVC:DXY", title: "DXY" },
        { proName: "COMEX:GC1!", title: "Gold" },
        { proName: "COMEX:SI1!", title: "Silver" },
        { proName: "COMEX:HG1!", title: "Copper" },
        { proName: "NYMEX:CL1!", title: "Crude" },
        { proName: "NYMEX:NG1!", title: "NatGas" },
        { proName: "COINBASE:BTCUSD", title: "BTC" },
        { proName: "COINBASE:ETHUSD", title: "ETH" }
      ],
      showSymbolLogo: false,
      colorTheme: "dark",
      isTransparent: true,
      displayMode: "adaptive",
      locale: "en"
    })

    container.appendChild(script)

    return () => {
      container.innerHTML = ''
    }
  }, [])

  return (
    <div className="tradingview-widget-container w-full h-12 overflow-hidden bg-gray-900/50 border-b border-gray-800">
      <div ref={containerRef} className="tradingview-widget-container__widget h-full" />
    </div>
  )
}
