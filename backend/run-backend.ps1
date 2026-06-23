$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$backendRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $backendRoot

function Get-DockerDesktopPath {
    $candidates = @()

    if ($env:ProgramFiles) {
        $candidates += (Join-Path $env:ProgramFiles 'Docker\Docker\Docker Desktop.exe')
    }

    if (${env:ProgramFiles(x86)}) {
        $candidates += (Join-Path ${env:ProgramFiles(x86)} 'Docker\Docker\Docker Desktop.exe')
    }

    if ($env:LocalAppData) {
        $candidates += (Join-Path $env:LocalAppData 'Docker\Docker Desktop.exe')
    }

    foreach ($candidate in $candidates) {
        if ($candidate -and (Test-Path $candidate)) {
            return $candidate
        }
    }

    return $null
}

function Start-DockerDesktopIfNeeded {
    $dockerProcess = Get-Process -ErrorAction SilentlyContinue | Where-Object {
        $_.ProcessName -eq 'Docker Desktop' -or $_.ProcessName -eq 'com.docker.backend'
    }

    if ($dockerProcess) {
        return
    }

    $dockerDesktopPath = Get-DockerDesktopPath
    if (-not $dockerDesktopPath) {
        throw 'Docker Desktop was not found. Install Docker Desktop or update run-backend.ps1 with the correct path.'
    }

    Start-Process -FilePath $dockerDesktopPath | Out-Null
}

function Wait-ForDocker {
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        throw 'Docker CLI was not found on PATH.'
    }

    $maxAttempts = 60
    for ($attempt = 1; $attempt -le $maxAttempts; $attempt++) {
        & docker info *> $null
        if ($LASTEXITCODE -eq 0) {
            return
        }

        if ($attempt -eq $maxAttempts) {
            throw 'Docker did not become ready in time.'
        }

        Start-Sleep -Seconds 2
    }
}

function Start-Compose {
    & docker compose version *> $null
    if ($LASTEXITCODE -eq 0) {
        docker compose -f docker-compose.yml up -d
        return
    }

    if (Get-Command docker-compose -ErrorAction SilentlyContinue) {
        docker-compose -f docker-compose.yml up -d
        return
    }

    throw 'Neither `docker compose` nor `docker-compose` is available.'
}

Start-DockerDesktopIfNeeded
Wait-ForDocker
Start-Compose

uvicorn app.main:app --reload