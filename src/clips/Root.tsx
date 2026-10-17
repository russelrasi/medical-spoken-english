// Entry for `npm run clips:studio` / `clips:render`. Not bundled into the web app.
// Regenerate this list after building new explainers (see POLISH.md).
import { Composition, registerRoot, staticFile } from 'remotion'
import { Explainer, type Script } from './Explainer'
import { Celebrate, CELEBRATE_FRAMES } from './Celebrate'
import { THEMES } from '../theme'
import { FPS, H, W } from './theme'
import m1w1c1 from '../../public/explainers/m1w1c1.json'
import m1w1c2 from '../../public/explainers/m1w1c2.json'
import m1w1c3 from '../../public/explainers/m1w1c3.json'
import m1w2c4 from '../../public/explainers/m1w2c4.json'
import m1w2c5 from '../../public/explainers/m1w2c5.json'
import m1w2c6 from '../../public/explainers/m1w2c6.json'
import m1w3c7 from '../../public/explainers/m1w3c7.json'
import m1w3c8 from '../../public/explainers/m1w3c8.json'
import m1w3c9 from '../../public/explainers/m1w3c9.json'
import m1w4c10 from '../../public/explainers/m1w4c10.json'
import m1w4c11 from '../../public/explainers/m1w4c11.json'
import m1w4c12 from '../../public/explainers/m1w4c12.json'
import m2w5c13 from '../../public/explainers/m2w5c13.json'
import m2w5c14 from '../../public/explainers/m2w5c14.json'
import m2w5c15 from '../../public/explainers/m2w5c15.json'
import m2w6c16 from '../../public/explainers/m2w6c16.json'
import m2w6c17 from '../../public/explainers/m2w6c17.json'
import m2w6c18 from '../../public/explainers/m2w6c18.json'
import m2w7c19 from '../../public/explainers/m2w7c19.json'
import m2w7c20 from '../../public/explainers/m2w7c20.json'
import m2w7c21 from '../../public/explainers/m2w7c21.json'
import m2w8c22 from '../../public/explainers/m2w8c22.json'
import m2w8c23 from '../../public/explainers/m2w8c23.json'
import m2w8c24 from '../../public/explainers/m2w8c24.json'
import m3w10c28 from '../../public/explainers/m3w10c28.json'
import m3w10c29 from '../../public/explainers/m3w10c29.json'
import m3w10c30 from '../../public/explainers/m3w10c30.json'
import m3w11c31 from '../../public/explainers/m3w11c31.json'
import m3w11c32 from '../../public/explainers/m3w11c32.json'
import m3w11c33 from '../../public/explainers/m3w11c33.json'
import m3w12c34 from '../../public/explainers/m3w12c34.json'
import m3w12c35 from '../../public/explainers/m3w12c35.json'
import m3w12c36 from '../../public/explainers/m3w12c36.json'
import m3w9c25 from '../../public/explainers/m3w9c25.json'
import m3w9c26 from '../../public/explainers/m3w9c26.json'
import m3w9c27 from '../../public/explainers/m3w9c27.json'

const Root = () => (
  <>
    <Composition id="Explainer-m1w1c1" component={Explainer} durationInFrames={(m1w1c1 as Script).totalFrames} fps={FPS} width={W} height={H}
      defaultProps={{ script: m1w1c1 as Script, audioBase: staticFile('explainers/'), palette: THEMES[0].palette }} />
    <Composition id="Explainer-m1w1c2" component={Explainer} durationInFrames={(m1w1c2 as Script).totalFrames} fps={FPS} width={W} height={H}
      defaultProps={{ script: m1w1c2 as Script, audioBase: staticFile('explainers/'), palette: THEMES[0].palette }} />
    <Composition id="Explainer-m1w1c3" component={Explainer} durationInFrames={(m1w1c3 as Script).totalFrames} fps={FPS} width={W} height={H}
      defaultProps={{ script: m1w1c3 as Script, audioBase: staticFile('explainers/'), palette: THEMES[0].palette }} />
    <Composition id="Explainer-m1w2c4" component={Explainer} durationInFrames={(m1w2c4 as Script).totalFrames} fps={FPS} width={W} height={H}
      defaultProps={{ script: m1w2c4 as Script, audioBase: staticFile('explainers/'), palette: THEMES[0].palette }} />
    <Composition id="Explainer-m1w2c5" component={Explainer} durationInFrames={(m1w2c5 as Script).totalFrames} fps={FPS} width={W} height={H}
      defaultProps={{ script: m1w2c5 as Script, audioBase: staticFile('explainers/'), palette: THEMES[0].palette }} />
    <Composition id="Explainer-m1w2c6" component={Explainer} durationInFrames={(m1w2c6 as Script).totalFrames} fps={FPS} width={W} height={H}
      defaultProps={{ script: m1w2c6 as Script, audioBase: staticFile('explainers/'), palette: THEMES[0].palette }} />
    <Composition id="Explainer-m1w3c7" component={Explainer} durationInFrames={(m1w3c7 as Script).totalFrames} fps={FPS} width={W} height={H}
      defaultProps={{ script: m1w3c7 as Script, audioBase: staticFile('explainers/'), palette: THEMES[0].palette }} />
    <Composition id="Explainer-m1w3c8" component={Explainer} durationInFrames={(m1w3c8 as Script).totalFrames} fps={FPS} width={W} height={H}
      defaultProps={{ script: m1w3c8 as Script, audioBase: staticFile('explainers/'), palette: THEMES[0].palette }} />
    <Composition id="Explainer-m1w3c9" component={Explainer} durationInFrames={(m1w3c9 as Script).totalFrames} fps={FPS} width={W} height={H}
      defaultProps={{ script: m1w3c9 as Script, audioBase: staticFile('explainers/'), palette: THEMES[0].palette }} />
    <Composition id="Explainer-m1w4c10" component={Explainer} durationInFrames={(m1w4c10 as Script).totalFrames} fps={FPS} width={W} height={H}
      defaultProps={{ script: m1w4c10 as Script, audioBase: staticFile('explainers/'), palette: THEMES[0].palette }} />
    <Composition id="Explainer-m1w4c11" component={Explainer} durationInFrames={(m1w4c11 as Script).totalFrames} fps={FPS} width={W} height={H}
      defaultProps={{ script: m1w4c11 as Script, audioBase: staticFile('explainers/'), palette: THEMES[0].palette }} />
    <Composition id="Explainer-m1w4c12" component={Explainer} durationInFrames={(m1w4c12 as Script).totalFrames} fps={FPS} width={W} height={H}
      defaultProps={{ script: m1w4c12 as Script, audioBase: staticFile('explainers/'), palette: THEMES[0].palette }} />
    <Composition id="Explainer-m2w5c13" component={Explainer} durationInFrames={(m2w5c13 as Script).totalFrames} fps={FPS} width={W} height={H}
      defaultProps={{ script: m2w5c13 as Script, audioBase: staticFile('explainers/'), palette: THEMES[0].palette }} />
    <Composition id="Explainer-m2w5c14" component={Explainer} durationInFrames={(m2w5c14 as Script).totalFrames} fps={FPS} width={W} height={H}
      defaultProps={{ script: m2w5c14 as Script, audioBase: staticFile('explainers/'), palette: THEMES[0].palette }} />
    <Composition id="Explainer-m2w5c15" component={Explainer} durationInFrames={(m2w5c15 as Script).totalFrames} fps={FPS} width={W} height={H}
      defaultProps={{ script: m2w5c15 as Script, audioBase: staticFile('explainers/'), palette: THEMES[0].palette }} />
    <Composition id="Explainer-m2w6c16" component={Explainer} durationInFrames={(m2w6c16 as Script).totalFrames} fps={FPS} width={W} height={H}
      defaultProps={{ script: m2w6c16 as Script, audioBase: staticFile('explainers/'), palette: THEMES[0].palette }} />
    <Composition id="Explainer-m2w6c17" component={Explainer} durationInFrames={(m2w6c17 as Script).totalFrames} fps={FPS} width={W} height={H}
      defaultProps={{ script: m2w6c17 as Script, audioBase: staticFile('explainers/'), palette: THEMES[0].palette }} />
    <Composition id="Explainer-m2w6c18" component={Explainer} durationInFrames={(m2w6c18 as Script).totalFrames} fps={FPS} width={W} height={H}
      defaultProps={{ script: m2w6c18 as Script, audioBase: staticFile('explainers/'), palette: THEMES[0].palette }} />
    <Composition id="Explainer-m2w7c19" component={Explainer} durationInFrames={(m2w7c19 as Script).totalFrames} fps={FPS} width={W} height={H}
      defaultProps={{ script: m2w7c19 as Script, audioBase: staticFile('explainers/'), palette: THEMES[0].palette }} />
    <Composition id="Explainer-m2w7c20" component={Explainer} durationInFrames={(m2w7c20 as Script).totalFrames} fps={FPS} width={W} height={H}
      defaultProps={{ script: m2w7c20 as Script, audioBase: staticFile('explainers/'), palette: THEMES[0].palette }} />
    <Composition id="Explainer-m2w7c21" component={Explainer} durationInFrames={(m2w7c21 as Script).totalFrames} fps={FPS} width={W} height={H}
      defaultProps={{ script: m2w7c21 as Script, audioBase: staticFile('explainers/'), palette: THEMES[0].palette }} />
    <Composition id="Explainer-m2w8c22" component={Explainer} durationInFrames={(m2w8c22 as Script).totalFrames} fps={FPS} width={W} height={H}
      defaultProps={{ script: m2w8c22 as Script, audioBase: staticFile('explainers/'), palette: THEMES[0].palette }} />
    <Composition id="Explainer-m2w8c23" component={Explainer} durationInFrames={(m2w8c23 as Script).totalFrames} fps={FPS} width={W} height={H}
      defaultProps={{ script: m2w8c23 as Script, audioBase: staticFile('explainers/'), palette: THEMES[0].palette }} />
    <Composition id="Explainer-m2w8c24" component={Explainer} durationInFrames={(m2w8c24 as Script).totalFrames} fps={FPS} width={W} height={H}
      defaultProps={{ script: m2w8c24 as Script, audioBase: staticFile('explainers/'), palette: THEMES[0].palette }} />
    <Composition id="Explainer-m3w10c28" component={Explainer} durationInFrames={(m3w10c28 as Script).totalFrames} fps={FPS} width={W} height={H}
      defaultProps={{ script: m3w10c28 as Script, audioBase: staticFile('explainers/'), palette: THEMES[0].palette }} />
    <Composition id="Explainer-m3w10c29" component={Explainer} durationInFrames={(m3w10c29 as Script).totalFrames} fps={FPS} width={W} height={H}
      defaultProps={{ script: m3w10c29 as Script, audioBase: staticFile('explainers/'), palette: THEMES[0].palette }} />
    <Composition id="Explainer-m3w10c30" component={Explainer} durationInFrames={(m3w10c30 as Script).totalFrames} fps={FPS} width={W} height={H}
      defaultProps={{ script: m3w10c30 as Script, audioBase: staticFile('explainers/'), palette: THEMES[0].palette }} />
    <Composition id="Explainer-m3w11c31" component={Explainer} durationInFrames={(m3w11c31 as Script).totalFrames} fps={FPS} width={W} height={H}
      defaultProps={{ script: m3w11c31 as Script, audioBase: staticFile('explainers/'), palette: THEMES[0].palette }} />
    <Composition id="Explainer-m3w11c32" component={Explainer} durationInFrames={(m3w11c32 as Script).totalFrames} fps={FPS} width={W} height={H}
      defaultProps={{ script: m3w11c32 as Script, audioBase: staticFile('explainers/'), palette: THEMES[0].palette }} />
    <Composition id="Explainer-m3w11c33" component={Explainer} durationInFrames={(m3w11c33 as Script).totalFrames} fps={FPS} width={W} height={H}
      defaultProps={{ script: m3w11c33 as Script, audioBase: staticFile('explainers/'), palette: THEMES[0].palette }} />
    <Composition id="Explainer-m3w12c34" component={Explainer} durationInFrames={(m3w12c34 as Script).totalFrames} fps={FPS} width={W} height={H}
      defaultProps={{ script: m3w12c34 as Script, audioBase: staticFile('explainers/'), palette: THEMES[0].palette }} />
    <Composition id="Explainer-m3w12c35" component={Explainer} durationInFrames={(m3w12c35 as Script).totalFrames} fps={FPS} width={W} height={H}
      defaultProps={{ script: m3w12c35 as Script, audioBase: staticFile('explainers/'), palette: THEMES[0].palette }} />
    <Composition id="Explainer-m3w12c36" component={Explainer} durationInFrames={(m3w12c36 as Script).totalFrames} fps={FPS} width={W} height={H}
      defaultProps={{ script: m3w12c36 as Script, audioBase: staticFile('explainers/'), palette: THEMES[0].palette }} />
    <Composition id="Explainer-m3w9c25" component={Explainer} durationInFrames={(m3w9c25 as Script).totalFrames} fps={FPS} width={W} height={H}
      defaultProps={{ script: m3w9c25 as Script, audioBase: staticFile('explainers/'), palette: THEMES[0].palette }} />
    <Composition id="Explainer-m3w9c26" component={Explainer} durationInFrames={(m3w9c26 as Script).totalFrames} fps={FPS} width={W} height={H}
      defaultProps={{ script: m3w9c26 as Script, audioBase: staticFile('explainers/'), palette: THEMES[0].palette }} />
    <Composition id="Explainer-m3w9c27" component={Explainer} durationInFrames={(m3w9c27 as Script).totalFrames} fps={FPS} width={W} height={H}
      defaultProps={{ script: m3w9c27 as Script, audioBase: staticFile('explainers/'), palette: THEMES[0].palette }} />
    <Composition id="Celebrate" component={Celebrate} durationInFrames={CELEBRATE_FRAMES} fps={FPS} width={W} height={H}
      defaultProps={{ pct: 90, xp: 100, correct: 9, total: 10, streak: 3 }} />
  </>
)
registerRoot(Root)
