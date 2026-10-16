// Entry for `npm run clips:studio` / `clips:render`. Not bundled into the web app.
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
    <Composition id="Celebrate" component={Celebrate} durationInFrames={CELEBRATE_FRAMES} fps={FPS} width={W} height={H}
      defaultProps={{ pct: 90, xp: 100, correct: 9, total: 10, streak: 3 }} />
  </>
)
registerRoot(Root)
