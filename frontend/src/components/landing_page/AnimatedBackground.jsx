import React from 'react'

export default function AnimatedBackground({ p1Glow, p2Glow, p1GlowPos = '20% 40%', p2GlowPos = '80% 60%' }) {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none" style={{ backgroundColor: '#fef7e2' }}>
      {/* Pattern Layer */}
      <div 
        className="absolute top-0 left-0 opacity-40"
        style={{
          width: 'calc(100vw + 400px)',
          height: 'calc(100vh + 400px)',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Cg fill='none' stroke='%23f3dfb3' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='40' cy='40' r='12'/%3E%3Ccircle cx='40' cy='40' r='5'/%3E%3Cpath d='M120 30 Q130 10, 150 20 T170 50' /%3E%3Cpath d='M160 140 A15 15 0 0 1 180 160' stroke-width='4'/%3E%3Cpolygon points='30,160 50,160 40,140' fill='%23f3dfb3' stroke='none'/%3E%3Crect x='80' y='150' width='20' height='8' rx='4' transform='rotate(-30 90 154)' /%3E%3Cpath d='M90 80 Q100 60 110 80 T130 80' /%3E%3Cpath d='M20 100 L30 110 M30 100 L20 110' /%3E%3Ccircle cx='150' cy='100' r='5' fill='%23f3dfb3' stroke='none'/%3E%3C/g%3E%3C/svg%3E")`,
          animation: 'pan-pattern 15s linear infinite',
        }}
      />

      {/* Dynamic Glows (Optional) */}
      {(p1Glow || p2Glow) && (
        <div 
          className="absolute inset-0 transition-opacity duration-1000"
          style={{
            backgroundImage: `
              radial-gradient(circle at ${p1GlowPos}, ${p1Glow || 'transparent'} 0%, transparent 45%),
              radial-gradient(circle at ${p2GlowPos}, ${p2Glow || 'transparent'} 0%, transparent 45%)
            `,
          }}
        />
      )}

      {/* Back Wave */}
      <div 
        className="absolute bottom-0 left-0 w-full h-[18vh] min-h-[120px] opacity-40"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='100' viewBox='0 0 1200 100' preserveAspectRatio='none'%3E%3Cpath d='M0 50 Q 300 10 600 50 T 1200 50 L 1200 100 L 0 100 Z' fill='%23e67e22'/%3E%3C/svg%3E")`,
          backgroundSize: '1200px 100%',
          backgroundRepeat: 'repeat-x',
          animation: 'roll-wave 20s linear infinite reverse'
        }}
      />

      {/* Front Wave */}
      <div 
        className="absolute bottom-0 left-0 w-full h-[15vh] min-h-[100px]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='100' viewBox='0 0 1200 100' preserveAspectRatio='none'%3E%3Cpath d='M0 50 Q 300 10 600 50 T 1200 50 L 1200 100 L 0 100 Z' fill='%23f99639'/%3E%3C/svg%3E")`,
          backgroundSize: '1200px 100%',
          backgroundRepeat: 'repeat-x',
          animation: 'roll-wave 12s linear infinite'
        }}
      />
    </div>
  )
}
