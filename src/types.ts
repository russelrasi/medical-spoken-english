export interface Bi { en: string; bn: string }

interface Base { id: string; prompt_en: string; prompt_bn: string }

export interface VocabSelect extends Base {
  type: 'vocab_select'
  stem: string
  stem_lang: 'en' | 'bn'
  option_lang: 'en' | 'bn'
  options: string[]
  answer: string
  pron?: string
  speak?: string
}
export interface Match extends Base {
  type: 'match'
  pairs: { left: string; right: string }[]
  left_lang: 'en' | 'bn'
  right_lang: 'en' | 'bn'
}
export interface FillBlank extends Base {
  type: 'fill_blank'
  sentence: string
  options: string[]
  answer: string
  note_en?: string
}
export interface Order extends Base {
  type: 'order'
  hint: string
  hint_lang?: 'bn'
  tokens: string[]
  answer: string
  speak?: string
}
export interface Listen extends Base {
  type: 'listen'
  audio_text: string
  options: string[]
  answer: string
  translation_bn: string
}
export type Exercise = VocabSelect | Match | FillBlank | Order | Listen

export interface Guidebook {
  objectives: Bi[]
  outcome: Bi
  grammar: {
    rule: Bi
    points: Bi[]
    examples: Bi[]
    mistakes: { wrong: string; right: string; note_bn: string }[]
  }[]
  vocab: { en: string; bn: string; pron: string; example_en: string; example_bn: string }[]
  dialogue: { setting: Bi; lines: { who: string; en: string; bn: string }[] }
}

export interface ClassUnit {
  id: string
  no: number
  month: number
  week: number
  title: Bi
  grammar: Bi
  revision: boolean
  /** Alternative version of a class for side-by-side comparison; excluded from progress totals. */
  variant?: boolean
  guidebook: Guidebook
  speaking: { text: string; bn: string }[]
  exercises: Exercise[]
}
export interface Week { id: string; week: number; classes: ClassUnit[] }
export interface Month { id: string; month: number; title: Bi; weeks: Week[] }
export interface Course {
  schema: number
  course: { id: string; title: Bi; learner: string; months: Month[] }
}
