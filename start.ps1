Write-Host "🚀 تشغيل chatbot المدرسة..." -ForegroundColor Cyan
Write-Host "افتح المتصفح على: http://localhost:8000" -ForegroundColor Green
Write-Host "اضغط Ctrl+C للإيقاف" -ForegroundColor Yellow
python -m http.server 8000 --directory "$PSScriptRoot"
