# Read ..\account-main\.env and set process environment variables
Get-Content "..\account-main\.env" | ForEach-Object {
    $line = $_.Trim()
    if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
        $idx = $line.IndexOf("=")
        $key = $line.Substring(0, $idx).Trim()
        $val = $line.Substring($idx + 1).Trim()
        [System.Environment]::SetEnvironmentVariable($key, $val, "Process")
    }
}

$oldProc = Get-NetTCPConnection -LocalPort 8081 -State Listen -ErrorAction SilentlyContinue
if ($oldProc) {
    Stop-Process -Id $oldProc.OwningProcess -Force
    Start-Sleep -Seconds 1
}

Start-Process -FilePath "C:\Users\rohit\AppData\Roaming\Antigravity IDE\User\globalStorage\pleiades.java-extension-pack-jdk\java\17\bin\java.exe" -ArgumentList "@C:\Users\rohit\AppData\Local\Temp\cp_53z4noxc71t5bikicr5rrz0sg.argfile com.erp.account.AccountApplication" -WorkingDirectory "D:\final2\finalcode1\finalcode1\account-main" -RedirectStandardOutput "D:\final2\finalcode1\finalcode1\account-main\app.log" -RedirectStandardError "D:\final2\finalcode1\finalcode1\account-main\app_err.log"

Write-Host "Started account service. Waiting for port 8081..."
for ($i = 0; $i -lt 45; $i++) {
    Start-Sleep -Seconds 1
    $conn = Get-NetTCPConnection -LocalPort 8081 -State Listen -ErrorAction SilentlyContinue
    if ($conn) {
        Write-Host "Port 8081 is listening! PID: $($conn.OwningProcess)"
        exit 0
    }
}
Write-Host "Timeout waiting for 8081"
Get-Content "..\account-main\app_err.log" -Tail 20
exit 1
