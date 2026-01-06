# PowerShell script untuk switch environment (Windows)
# Usage: .\scripts\switch-env.ps1 [local|production]

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("local", "production")]
    [string]$env = ""
)

$envFiles = @{
    local = @{
        VITE_API_URL = "http://127.0.0.1:8000"
        VITE_ENV = "local"
    }
    production = @{
        VITE_API_URL = "http://103.164.99.2:1101"
        VITE_ENV = "production"
    }
}

function Switch-Environment {
    param([string]$envName)
    
    if (-not $envFiles.ContainsKey($envName)) {
        Write-Host "❌ Environment `"$envName`" tidak valid!" -ForegroundColor Red
        Write-Host "Gunakan: local atau production" -ForegroundColor Yellow
        exit 1
    }
    
    $envPath = Join-Path $PSScriptRoot ".." ".env"
    $envConfig = $envFiles[$envName]
    
    $envContent = @"
# Environment: $envName
VITE_API_URL=$($envConfig.VITE_API_URL)
VITE_ENV=$($envConfig.VITE_ENV)
"@
    
    try {
        $envContent | Out-File -FilePath $envPath -Encoding utf8 -NoNewline
        Write-Host "✅ Environment switched to: $($envName.ToUpper())" -ForegroundColor Green
        Write-Host "📝 API URL: $($envConfig.VITE_API_URL)" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "💡 Restart dev server dengan: npm run dev" -ForegroundColor Yellow
    } catch {
        Write-Host "❌ Error writing .env file: $_" -ForegroundColor Red
        exit 1
    }
}

# Main
if ([string]::IsNullOrEmpty($env)) {
    Write-Host "🔧 Environment Switcher" -ForegroundColor Cyan
    Write-Host "=====================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage: .\scripts\switch-env.ps1 [local|production]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Atau gunakan npm scripts:" -ForegroundColor Yellow
    Write-Host "  npm run env:local      - Switch ke local" -ForegroundColor White
    Write-Host "  npm run env:prod       - Switch ke production" -ForegroundColor White
    Write-Host ""
    
    # Check current environment
    $envPath = Join-Path $PSScriptRoot ".." ".env"
    if (Test-Path $envPath) {
        $currentEnv = Get-Content $envPath -Raw
        if ($currentEnv -match "VITE_ENV=(.+)") {
            Write-Host "Current environment: $($matches[1].ToUpper())" -ForegroundColor Green
        }
    }
    exit 0
}

Switch-Environment -envName $env

