@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$path='%~f0'; $lines=Get-Content $path; $script=$lines[3..($lines.Count-1)] -join [Environment]::NewLine; Invoke-Expression $script"
exit /b
Write-Host "It finally works!"
