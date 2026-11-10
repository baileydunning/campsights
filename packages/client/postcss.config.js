import purgecssModule from '@fullhuman/postcss-purgecss';
import autoprefixer from 'autoprefixer';

const purgecss = purgecssModule.default;

export const plugins = [
    autoprefixer,
    purgecss({
        content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
        defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || [],
        // Leaflet and its plugins add these classes at runtime, so they never
        // appear in our source and would otherwise be stripped.
        safelist: { greedy: [/leaflet/, /marker-cluster/, /campsite-cluster/] },
    }),
]