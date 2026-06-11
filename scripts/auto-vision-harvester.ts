const DISABLED_MESSAGE =
  '[auto-vision-harvester] Disabled: Codespace YouTube subtitle harvesting has been removed. Run harvest-youtube.py locally and upload youtube_payload.json instead.'

export async function runHarvester() {
  console.log(DISABLED_MESSAGE)
  return []
}

if (process.argv[1]?.endsWith('auto-vision-harvester.ts') || process.argv[1]?.endsWith('auto-vision-harvester.js')) {
  void runHarvester()
}
