import { lazy, Suspense, type ComponentProps } from 'react'

// Remotion Player is code-split: it only downloads when a clip is first shown.
const mod = () => import('./ClipPlayer')
const E = lazy(() => mod().then((m) => ({ default: m.ExplainerClip })))
const C = lazy(() => mod().then((m) => ({ default: m.CelebrateClip })))

const Fallback = () => <div className="clip-skel" aria-hidden="true" />

export const ExplainerClip = (p: ComponentProps<typeof E>) => <Suspense fallback={<Fallback />}><E {...p} /></Suspense>
export const CelebrateClip = (p: ComponentProps<typeof C>) => <Suspense fallback={<Fallback />}><C {...p} /></Suspense>
