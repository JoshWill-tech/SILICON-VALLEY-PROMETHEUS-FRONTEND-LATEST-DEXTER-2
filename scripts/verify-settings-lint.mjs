import { ESLint } from 'eslint'

async function run() {
  const eslint = new ESLint({ cache: true })
  const results = await eslint.lintFiles(['app/settings/page.tsx', 'app/settings/profile/page.tsx'])
  const hasErrors = results.some((r) => r.errorCount > 0)
  if (hasErrors) {
    const formatter = await eslint.loadFormatter('stylish')
    console.error(formatter.format(results))
    process.exit(1)
  }
  console.log('settings lint passed')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
