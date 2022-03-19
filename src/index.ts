import path from 'path'
import fse from 'fs-extra'
import minimist from 'minimist'
import prompts from 'prompts'

const cwd = process.cwd()
const argv = minimist(process.argv.slice(2), { string: ['_'] })
const pkgRegx = /^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/

async function bootstrap() {
  console.log("💿 Welcome to njs! Let's get you set up with a new project.\n")
  let targetDir = argv._[0]
  const defaultProjectName = targetDir ?? 'njs'

  const result = await prompts(
    [
      {
        type: targetDir ? null : 'text',
        name: 'projectName',
        message: 'Project name:',
        initial: defaultProjectName,
        onState: (state) => {
          targetDir = state.value.trim() || defaultProjectName
        },
      },
      {
        type: () => {
          if (
            fse.existsSync(targetDir) &&
            fse.readdirSync(targetDir).length !== 0
          ) {
            return 'confirm'
          }

          return null
        },
        name: 'overwrite',
        message: () => {
          const target =
            targetDir === '.'
              ? 'Current directory'
              : `Target directory "${targetDir}"`

          return `⚠️ ${target} is not empty. Remove existing files and continue?`
        },
      },
      {
        type: (_, { overwrite }) => {
          if (overwrite === false) {
            const target =
              targetDir === '.'
                ? 'Current directory'
                : `Target directory "${targetDir}"`

            throw new Error(
              `️🚨 Oops, ${target} already exists. Please try again with a different directory.`,
            )
          }
          return null
        },
        name: 'overwriteCancelled',
      },
      {
        type: 'text',
        name: 'packageName',
        message: 'Package name:',
        validate: (dir) => pkgRegx.test(dir) || 'Invalid package.json name',
      },
    ],
    {
      onCancel: () => {
        throw new Error('✖ Operation cancelled')
      },
    },
  )

  const { overwrite, packageName } = result

  const root = path.resolve(cwd, targetDir)
  const template = path.resolve(__dirname, '..', 'template')

  if (overwrite) {
    fse.emptyDirSync(root)
  } else {
    fse.ensureDirSync(root)
  }

  for (const file of fse.readdirSync(template)) {
    if (file === 'package.json') {
      const pkg = fse.readJSONSync(path.resolve(template, file))
      pkg.name = packageName
      fse.writeJSONSync(path.resolve(root, file), pkg, { spaces: 2 })
    } else if (path.extname(file) === '.ts') {
      fse.ensureDirSync(path.resolve(root, 'src'))
      fse.copyFileSync(
        path.resolve(template, file),
        path.resolve(root, 'src', file),
      )
    } else {
      fse.copyFileSync(path.resolve(template, file), path.resolve(root, file))
    }
  }

  console.log(`\nDone. Now run:\n`)

  if (root !== cwd) {
    console.log(`  cd ${path.relative(cwd, root)}`)
  }

  console.log('  pnpm install')
  console.log('  pnpm dev')
}

bootstrap()
