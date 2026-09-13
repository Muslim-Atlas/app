# Muslim Atlas - Automated Release APK Builder
Param(
  [string]$Version = "1.1.0"
)

$ErrorActionPreference = "Stop"

Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "Muslim Atlas v$Version Standalone APK Build" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan

# 1. Check Android SDK and Java
if (-not $env:ANDROID_HOME) {
  $env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
}
Write-Host "[INFO] ANDROID_HOME: $env:ANDROID_HOME" -ForegroundColor Gray

# 2. Navigate to android folder
$rootDir = (Get-Item -Path $PSScriptRoot).Parent.FullName
$androidDir = Join-Path $rootDir "android"

if (-not (Test-Path $androidDir)) {
  Write-Error "Could not find android directory at: $androidDir"
  exit 1
}

Write-Host "[BUILD] Running Gradle assembleRelease..." -ForegroundColor Yellow
Push-Location $androidDir
try {
  & .\gradlew.bat assembleRelease --no-daemon
  if ($LASTEXITCODE -ne 0) {
    Write-Error "Gradle build failed with exit code $LASTEXITCODE"
    exit $LASTEXITCODE
  }
} finally {
  Pop-Location
}

# 3. Locate compiled APK
$releaseApkDir = Join-Path $androidDir "app\build\outputs\apk\release"
$defaultApk = Join-Path $releaseApkDir "app-release.apk"

if (-not (Test-Path $defaultApk)) {
  $foundApk = Get-ChildItem -Path $releaseApkDir -Filter "*.apk" | Select-Object -First 1
  if ($foundApk) {
    $defaultApk = $foundApk.FullName
  } else {
    Write-Error "Could not locate compiled APK in $releaseApkDir"
    exit 1
  }
}

# 4. Copy to standardized named APK
$finalApkPath = Join-Path $releaseApkDir "MuslimAtlas-v$Version.apk"
Copy-Item -Path $defaultApk -Destination $finalApkPath -Force

# 5. Output file metrics
$apkItem = Get-Item $finalApkPath
$apkSizeMb = [math]::Round($apkItem.Length / 1MB, 2)
$hash = (Get-FileHash -Path $finalApkPath -Algorithm SHA256).Hash

Write-Host ""
Write-Host "=====================================================" -ForegroundColor Green
Write-Host "[SUCCESS] Build Complete!" -ForegroundColor Green
Write-Host "=====================================================" -ForegroundColor Green
Write-Host "APK Location : $finalApkPath" -ForegroundColor White
Write-Host "File Size    : $apkSizeMb MB" -ForegroundColor White
Write-Host "SHA-256      : $hash" -ForegroundColor White
Write-Host "Ready to side-load and test on your Android device." -ForegroundColor Cyan
