# Gates: jarvis-filament-waveform-permanence

OWNS: components/navigation/jarvis-top-nav-filament.tsx, hooks/use-voice-companion.ts, tests/jarvis-filament-visibility.test.mjs, tests/jarvis-filament-wavy.test.mjs, GATES-jarvis-wavy.md

Scope: Ensure the Jarvis voice neural filament waveform is permanently animated and wavy whenever the user or Jarvis speaks, across all platform motion preferences, while maintaining full audio reactivity, volume tracking, and exception resilience.

- [x] G1: Filament animates an expressive dynamic waveform when the user speaks in voice companion or chat across all motion settings.
  CHECK: node --test --test-name-pattern="Filament animates wave when individual speaks" tests/jarvis-filament-wavy.test.mjs
  EXPECT: pass 2
  EVIDENCE: automatic-evidence=v1; definition-sha256=13f47a90847ccd301ecbde36665f883d2bd403d175c47f9eca05ebd9ef3b5e90; exit=0; EXPECT=matched; output-sha256=15c39d9d7d225c4d80d35157998272393b32d7f401533047cad2d9e78004488f; output-bytes=307; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=6148c563d008/34 entries

- [x] G2: Filament animates an expressive dynamic waveform when Jarvis speaks in voice companion or chat across all motion settings.
  CHECK: node --test --test-name-pattern="Filament animates wave when Jarvis speaks" tests/jarvis-filament-wavy.test.mjs
  EXPECT: pass 3
  EVIDENCE: automatic-evidence=v1; definition-sha256=614c05b824fd933bf46abb1ee64556fd80e4620ffdac8e3fe6a3544d29225714; exit=0; EXPECT=matched; output-sha256=740a6bf30762cc6563015aa845a831b40bf10342a729a0741bed49cb68a63d41; output-bytes=390; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=6148c563d008/34 entries

- [x] G3: Comprehensive wavy filament test suite covers all voice scenarios (listening, speaking, chat sync, reduced motion) with zero NaN and continuous animation.
  CHECK: node --test tests/jarvis-filament-wavy.test.mjs
  EXPECT: pass 6
  EVIDENCE: automatic-evidence=v1; definition-sha256=a6f27934b0a6400c7cd1d7d4e3d1316ce91054c9744eb7e402dc34eb8b4d9b19; exit=0; EXPECT=matched; output-sha256=46d877fb55d93701084b2f20818607b4e7e799c4091a5b48857b6fb0cc8a9e0b; output-bytes=674; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=6148c563d008/34 entries

- [x] G4: Core Prometheus Jarvis regression suite passes without regression.
  CHECK: node tests/prometheus-jarvis-voice-companion.test.mjs
  EXPECT: prometheus-jarvis-voice-companion: all checks passed successfully!
  EVIDENCE: automatic-evidence=v1; definition-sha256=2882713a84c8e280a52ec36a39f760f505c5d3a330dad97e3be704e551cd9f2a; exit=0; EXPECT=matched; output-sha256=973ab59ea7b39cf5be3b72841f5a7b976ab2af277614b3cfc1cfd21ced4f850a; output-bytes=128; shell=C:\Windows\system32\cmd.exe; cwd=C:\Users\HomePC\Documents\THE FRONT END, PROMETHEUS; path=6148c563d008/34 entries
