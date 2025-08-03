import purgecssModule from '@fullhuman/postcss-purgecss'
import autoprefixer from 'autoprefixer'

const purgecss = purgecssModule.default

export const plugins = [
  autoprefixer,
  purgecss({
    content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
    defaultExtractor: (content) => content.match(/[\w-/:]+(?<!:)/g) || [],
  }),
]
