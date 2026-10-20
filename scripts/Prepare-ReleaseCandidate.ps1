[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$repoRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
Set-Location -LiteralPath $repoRoot
$metadata = Get-Content -LiteralPath (Join-Path $repoRoot 'release-candidate.json') -Raw | ConvertFrom-Json
$rcVersion = [string]$metadata.version
if ($rcVersion -notmatch '^\d+\.\d+\.\d+-rc\.\d+$') { throw 'Invalid RC version.' }
[xml]$apiProject = Get-Content -LiteralPath (Join-Path $repoRoot 'backend/ClinicManagement/ClinicManagement.csproj') -Raw
$clientPackage = Get-Content -LiteralPath (Join-Path $repoRoot 'frontend/clinic-management-client/package.json') -Raw | ConvertFrom-Json
$lockVersions = (& node -e "const lock=require('./frontend/clinic-management-client/package-lock.json'); process.stdout.write(lock.version+'|'+lock.packages[''].version);").Split('|')
if ($LASTEXITCODE -ne 0 -or [string]$apiProject.Project.PropertyGroup.Version -ne $rcVersion -or $clientPackage.version -ne $rcVersion -or
    $lockVersions.Count -ne 2 -or $lockVersions[0] -ne $rcVersion -or $lockVersions[1] -ne $rcVersion) {
    throw 'Backend, frontend, lockfile and RC metadata versions must agree.'
}
if (& git status --porcelain --untracked-files=normal) { throw 'Commit the reviewed source before preparing an RC.' }
$sourceCommit = (& git rev-parse HEAD).Trim()
$sourceBranch = (& git branch --show-current).Trim()
$outputRoot = [IO.Path]::GetFullPath((Join-Path $repoRoot ('artifacts/rc/' + $rcVersion + '-' + [DateTime]::UtcNow.ToString('yyyyMMdd-HHmmss-fff'))))
if (-not $outputRoot.StartsWith($repoRoot + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) { throw 'Output must stay inside the repository.' }
$packageRoot = Join-Path $outputRoot ('clinic-management-' + $rcVersion)
$evidenceRoot = Join-Path $packageRoot 'evidence'
$apiRoot = Join-Path $packageRoot 'backend'
$frontendRoot = Join-Path $repoRoot 'frontend/clinic-management-client'
New-Item -ItemType Directory -Path $evidenceRoot -Force | Out-Null
$checks = [Collections.Generic.List[object]]::new()

function Get-RcFileHash {
    param([string]$Path)
    $algorithm = [Security.Cryptography.SHA256]::Create()
    $stream = [IO.File]::OpenRead($Path)
    try { return [BitConverter]::ToString($algorithm.ComputeHash($stream)).Replace('-', '').ToLowerInvariant() }
    finally { $stream.Dispose(); $algorithm.Dispose() }
}

function New-RcArchive {
    param([string]$SourceRoot, [string]$Destination)
    Add-Type -AssemblyName System.IO.Compression
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $archive = [IO.Compression.ZipFile]::Open($Destination, [IO.Compression.ZipArchiveMode]::Create)
    try {
        foreach ($path in [IO.Directory]::EnumerateFiles($SourceRoot, '*', [IO.SearchOption]::AllDirectories)) {
            $entryName = [IO.Path]::GetFileName($SourceRoot) + '/' + $path.Substring($SourceRoot.Length + 1).Replace('\', '/')
            [void][IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, $path, $entryName, [IO.Compression.CompressionLevel]::Optimal)
        }
    } finally { $archive.Dispose() }
}

function Invoke-RcCheck {
    param([string]$Name, [string]$Executable, [string[]]$Arguments, [string]$Directory = $repoRoot)
    $logPath = Join-Path $evidenceRoot ($Name + '.log')
    $started = [DateTime]::UtcNow
    Push-Location -LiteralPath $Directory
    $previousPreference = $ErrorActionPreference
    $commandPath = (Get-Command $Executable -ErrorAction Stop).Source
    try {
        $ErrorActionPreference = 'Continue'
        & $commandPath @Arguments 2>&1 | Out-File -LiteralPath $logPath -Encoding utf8
        $exitCode = $LASTEXITCODE
    } finally { $ErrorActionPreference = $previousPreference; Pop-Location }
    if ($exitCode -ne 0) {
        Get-Content -LiteralPath $logPath -Tail 70 | Write-Host
        throw "$Name failed with exit code $exitCode. No verified RC was produced."
    }
    $checks.Add([ordered]@{ name = $Name; exitCode = $exitCode; seconds = [Math]::Round(([DateTime]::UtcNow - $started).TotalSeconds, 2);
        log = 'evidence/' + $Name + '.log' })
    Write-Host "PASS $Name"
}

$savedTestConfiguration = $env:TEST_CONFIGURATION
$savedApiUrl = $env:VITE_API_BASE_URL
$savedHubUrl = $env:VITE_SIGNALR_HUB_URL
try {
    $env:TEST_CONFIGURATION = 'Release'
    Invoke-RcCheck 'release-build' 'dotnet' @('build', 'tests/Week2Verification/Week2Verification.csproj', '--configuration', 'Release', '--no-restore')
    Invoke-RcCheck 'frontend-tests' 'node' @('--test', '--test-reporter=spec', 'tests/*.test.mjs') $frontendRoot
    Invoke-RcCheck 'frontend-lint' 'npm.cmd' @('run', 'lint') $frontendRoot
    Invoke-RcCheck 'week10-production-ui-and-api' 'node' @('tests/week10-ui.mjs')
    Invoke-RcCheck 'week8-production-ui-and-api' 'node' @('tests/week8-ui.mjs', '--production')
    foreach ($suite in @('clinic-realtime', 'c6c7', 'billing-migrations-only')) {
        Invoke-RcCheck $suite 'dotnet' @('run', '--no-build', '--no-restore', '--configuration', 'Release', '--project', 'tests/Week2Verification', '--', ('--' + $suite))
    }
    Invoke-RcCheck 'backend-publish' 'dotnet' @('publish', 'backend/ClinicManagement/ClinicManagement.csproj', '--configuration', 'Release', '--no-restore', '--output', $apiRoot, '-p:UseAppHost=false')
    # Never package a developer's database connection, JWT key or environment-specific appsettings.
    [IO.Directory]::EnumerateFiles($apiRoot, 'appsettings*.json', [IO.SearchOption]::TopDirectoryOnly) | ForEach-Object { [IO.File]::Delete($_) }
    [ordered]@{
        Logging = @{ LogLevel = @{ Default = 'Information'; 'Microsoft.AspNetCore' = 'Warning' } }
        AllowedHosts = '*'
        ConnectionStrings = @{ DefaultConnection = '' }
        Jwt = @{ Issuer = 'ClinicManagement'; Audience = 'ClinicManagementClient'; Key = ''; AccessTokenExpirationMinutes = 30; RefreshTokenExpirationDays = 7 }
        AuthCookie = @{ Secure = $true; SameSite = 'Lax' }
    } | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath (Join-Path $apiRoot 'appsettings.json') -Encoding utf8
    Invoke-RcCheck 'published-api-integration' 'dotnet' @('run', '--no-build', '--no-restore', '--configuration', 'Release', '--project', 'tests/Week2Verification', '--', '--week10', '--api-dir', $apiRoot)
    $env:VITE_API_BASE_URL = '/api'
    $env:VITE_SIGNALR_HUB_URL = '/hubs/notification'
    Invoke-RcCheck 'frontend-package-build' 'npm.cmd' @('run', 'build') $frontendRoot
    Copy-Item -LiteralPath (Join-Path $frontendRoot 'dist') -Destination (Join-Path $packageRoot 'frontend') -Recurse
    New-Item -ItemType Directory -Path (Join-Path $packageRoot 'docs/api') -Force | Out-Null
    Copy-Item -LiteralPath (Join-Path $repoRoot $metadata.notes) -Destination (Join-Path $packageRoot 'docs/WEEK10-RC.md')
    Copy-Item -LiteralPath (Join-Path $repoRoot 'docs/api/department-head-statistics.md') -Destination (Join-Path $packageRoot 'docs/api/department-head-statistics.md')
    Copy-Item -LiteralPath (Join-Path $repoRoot 'docs/WEEK6-A6.md') -Destination (Join-Path $packageRoot 'docs/WEEK6-A6.md')
    Copy-Item -LiteralPath (Join-Path $repoRoot 'release-candidate.json') -Destination $packageRoot
    if ((& git rev-parse HEAD).Trim() -ne $sourceCommit -or (& git status --porcelain --untracked-files=normal)) {
        throw 'Source changed during verification. Run the RC process again from the final clean commit.'
    }
    $files = @([IO.Directory]::EnumerateFiles($packageRoot, '*', [IO.SearchOption]::AllDirectories) | Sort-Object | ForEach-Object {
        [ordered]@{ path = $_.Substring($packageRoot.Length + 1).Replace('\', '/'); sha256 = Get-RcFileHash $_ }
    })
    [ordered]@{ schemaVersion = 1; status = 'verified-release-candidate'; version = $rcVersion; sourceCommit = $sourceCommit;
        sourceBranch = $sourceBranch; createdAtUtc = [DateTime]::UtcNow.ToString('o'); scope = $metadata.scope;
        knownLimitations = $metadata.knownLimitations; dotnet = (& dotnet --version).Trim(); node = (& node --version).Trim();
        checks = @($checks.ToArray()); files = $files } | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $packageRoot 'manifest.json') -Encoding utf8
    $zipPath = Join-Path $outputRoot ('clinic-management-' + $rcVersion + '.zip')
    New-RcArchive $packageRoot $zipPath
    $zipHash = Get-RcFileHash $zipPath
    ($zipHash + '  ' + [IO.Path]::GetFileName($zipPath)) | Set-Content -LiteralPath ($zipPath + '.sha256') -Encoding ascii
    Write-Host "RC_ARTIFACT:$zipPath"
    Write-Host "RC_SOURCE:$sourceCommit"
    Write-Host "RC_SHA256:$zipHash"
} finally {
    $env:TEST_CONFIGURATION = $savedTestConfiguration
    $env:VITE_API_BASE_URL = $savedApiUrl
    $env:VITE_SIGNALR_HUB_URL = $savedHubUrl
}
