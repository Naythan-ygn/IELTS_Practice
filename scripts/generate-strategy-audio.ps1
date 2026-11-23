$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
$sprintSynth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$sprintSynth.SelectVoice('Microsoft Zira Desktop')
$sprintSynth.Rate = -1
$sprintAssets = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'audio-sources.json') -Raw -Encoding UTF8 | ConvertFrom-Json
foreach ($sprintAsset in $sprintAssets) {
  $sprintPath = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot ('../public' + $sprintAsset.path)))
  [IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($sprintPath)) | Out-Null
  if (-not [IO.File]::Exists($sprintPath)) {
    $sprintSynth.SetOutputToWaveFile($sprintPath)
    $sprintSynth.Speak($sprintAsset.text)
    $sprintSynth.SetOutputToNull()
  }
}
$sprintSynth.Dispose()
Write-Output "$($sprintAssets.Count) audio assets ready."
