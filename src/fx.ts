import confetti from 'canvas-confetti'

const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export function burst(big = false, origin = { x: 0.5, y: 0.85 }) {
  if (reduced()) return
  confetti({ particleCount: big ? 140 : 40, spread: big ? 90 : 60, startVelocity: big ? 45 : 32, origin,
    colors: ['#6fae93', '#7fa3c2', '#e0bd78', '#d98a86'], disableForReducedMotion: true, zIndex: 50 })
}
export const MILESTONES = [3, 7, 14, 30, 60, 100]
