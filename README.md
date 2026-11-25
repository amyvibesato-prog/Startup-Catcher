# Startup Catcher

Мінімалістичний нативний Windows-лаунчер і перехоплювач автозапуску (`HKCU\...\Run` та `shell:startup`). Замість хаотичного автостарту десятка програм при ввімкненні ПК відкривається одне компактне напівпрозоре вікно зі списком: обираєш потрібні галочками й запускаєш однією кнопкою.

## Структура проєкту

- `source/` — фронтенд на React + TypeScript + Vite + Tailwind CSS.
- `native/` — нативна Windows-обгортка на .NET 8 (WinForms + WebView2) із реальною прозорістю вікна (`Form.Opacity`), скануванням/перехопленням/відновленням записів автозапуску та запуском процесів.

## Збірка

```powershell
# 1. Зібрати фронтенд
cd source
npm install
npm run build

# 2. Зібрати нативний Windows-додаток (.NET 8)
cd ..\native
dotnet publish -c Release -r win-x64 --self-contained true -o ..\app

# 3. Скопіювати зібраний фронтенд у app\wwwroot
Copy-Item ..\source\dist ..\app\wwwroot -Recurse -Force
```
