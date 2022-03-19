import typescript from '@rollup/plugin-typescript'

/** @returns {import("rollup").RollupOptions} */
export default function rolllup() {
  return {
    input: 'src/index.ts',
    output: {
      banner: '#!/usr/bin/env node\n',
      dir: 'lib',
      format: 'cjs',
    },
    plugins: [typescript({ tsconfig: './tsconfig.json' })],
    external: ['fs-extra', 'minimist', 'prompts'],
  }
}
