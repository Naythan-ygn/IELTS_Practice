$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
$sprintVoice = New-Object System.Speech.Synthesis.SpeechSynthesizer
$sprintVoice.SelectVoice('Microsoft Zira Desktop')
$sprintVoice.Rate = -1
$sprintAudio = Join-Path $PSScriptRoot '../public/audio/workshop.wav'
$sprintVoice.SetOutputToWaveFile([IO.Path]::GetFullPath($sprintAudio))
$sprintVoice.Speak('Welcome to the Northbridge community learning centre. I am Maya, the programme coordinator. Here are the details for our Saturday study workshop. We originally planned to start at nine, but the building opens late, so the workshop will begin at nine thirty. Please arrive ten minutes early. The session will take place in the Willow room, not the Oak room, which is being repaired. The centre is on Park Street, opposite the museum. The workshop costs twelve pounds per person. This includes printed materials, but lunch is not provided. Please bring your own notebook. You do not need to bring a laptop because computers are available in the room. To book, contact Daniel at reception. His surname is Carter, spelt C A R T E R. Registration closes on Thursday. There are eighteen places in total. The first activity is a short reading exercise, followed by a discussion. Finally, if you come by bicycle, please leave it in the covered area behind the library. Thank you, and we look forward to seeing you on Saturday.')
$sprintVoice.Dispose()
Get-Item -LiteralPath $sprintAudio
