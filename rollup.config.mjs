import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import { config } from 'dotenv';
import { parseArgs } from 'node:util';
import injectProcessEnv from 'rollup-plugin-inject-process-env';
import nodePolyfills from 'rollup-plugin-polyfill-node';
import postcss from 'rollup-plugin-postcss';
import tsConfigPaths from 'rollup-plugin-tsconfig-paths';

const args = parseArgs({
  options: {
    environment: {
      type: 'string',
      short: 'e',
      default: 'development',
    },
    configuration: {
      type: 'string',
      short: 'c',
    },
  },
});

const env = args.values.environment;
const production = env === 'production';
let environmentVariablesPath = [ './.env.development' ];

console.log(`Building widget for ${env} environment...`);

if (production) {
  environmentVariablesPath = './.env.production';
}

const ENV_VARIABLES = config({
  path: environmentVariablesPath,
}).parsed;

const fileName = ENV_VARIABLES.WIDGET_NAME || 'widget.js';

export default {
  input: './src/widget/index.tsx',
  output: {
    file: `dist/${fileName}`,
    format: 'iife',
    sourcemap: false,
    inlineDynamicImports: true,
    globals: {
      'react/jsx-runtime': 'jsxRuntime',
      'react-dom/client': 'ReactDOM',
      react: 'React',
    },
  },
  plugins: [
    tsConfigPaths({
      tsConfigPath: './tsconfig.json',
    }),
    replace({ preventAssignment: true }),
    typescript({
      tsconfig: './tsconfig.json',
    }),
    nodeResolve({
      extensions: ['.tsx', '.ts', '.json', '.js', '.jsx', '.mjs'],
      browser: true,
      dedupe: ['react', 'react-dom'],
    }),
    babel({
      babelHelpers: 'bundled',
      exclude: 'node_modules/**',
      presets: [
        '@babel/preset-typescript',
        [
          '@babel/preset-react',
          {
            runtime: 'automatic',
            targets: '>0.1%, not dead, not op_mini all',
          },
        ],
      ],
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.mjs'],
    }),
    postcss({
      extensions: ['.css'],
      minimize: true,
      extract: true,
      inject: {
        insertAt: 'top',
      },
    }),
    commonjs(),
    nodePolyfills({
      exclude: ['crypto'],
    }),
    injectProcessEnv(ENV_VARIABLES),
    terser({
      ecma: 2020,
      mangle: { toplevel: true },
      compress: {
        module: true,
        toplevel: true,
        unsafe_arrows: true,
        drop_console: true,
        drop_debugger: true,
      },
      output: { quote_style: 1 },
    })
  ],
};
