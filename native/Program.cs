using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;
using Microsoft.Win32;

namespace StartupCatcher;

internal static class Program
{
    [STAThread]
    static void Main()
    {
        ApplicationConfiguration.Initialize();
        Application.Run(new MainForm());
    }
}

public sealed class MainForm : Form
{
    private readonly WebView2 _webView;
    private readonly string _appDir;
    private readonly string _wwwrootDir;
    private readonly string _dataDir;
    private readonly string _backupStartupDir;

    private const int DWMWA_USE_IMMUTABLE_DARK_MODE = 20;
    private const int DWMWA_WINDOW_CORNER_PREFERENCE = 33;
    private const int DWMWA_SYSTEMBACKDROP_TYPE = 38;
    private const int DWMWCP_ROUND = 2;
    private const int DWMSBT_TRANSIENTWINDOW = 3; // Acrylic

    private const int WM_NCLBUTTONDOWN = 0xA1;
    private const int HTCAPTION = 0x2;

    [StructLayout(LayoutKind.Sequential)]
    private struct MARGINS
    {
        public int cxLeftWidth;
        public int cxRightWidth;
        public int cyTopHeight;
        public int cyBottomHeight;
    }

    [DllImport("dwmapi.dll")]
    private static extern int DwmSetWindowAttribute(IntPtr hwnd, int attr, ref int attrValue, int attrSize);

    [DllImport("dwmapi.dll")]
    private static extern int DwmExtendFrameIntoClientArea(IntPtr hwnd, ref MARGINS pMarInset);

    [DllImport("user32.dll")]
    private static extern bool ReleaseCapture();

    [DllImport("user32.dll")]
    private static extern IntPtr SendMessage(IntPtr hWnd, int Msg, int wParam, int lParam);

    public MainForm()
    {
        _appDir = AppContext.BaseDirectory;
        _wwwrootDir = Path.Combine(_appDir, "wwwroot");
        _dataDir = Path.Combine(_appDir, "data");
        _backupStartupDir = Path.Combine(_dataDir, "startup_backup");
        Directory.CreateDirectory(_dataDir);
        Directory.CreateDirectory(_backupStartupDir);

        Text = "Startup Catcher";
        Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath);
        FormBorderStyle = FormBorderStyle.None;
        Width = 600;
        Height = 620;
        MinimumSize = new Size(480, 500);
        StartPosition = FormStartPosition.CenterScreen;
        BackColor = Color.Black;

        ApplyWindows11GlassStyle();

        _webView = new WebView2
        {
            Dock = DockStyle.Fill,
            DefaultBackgroundColor = Color.Transparent
        };
        Controls.Add(_webView);

        Load += async (_, _) => await InitializeWebViewAsync();
    }

    private void ApplyWindows11GlassStyle()
    {
        if (!IsHandleCreated) return;

        var darkMode = 1;
        DwmSetWindowAttribute(Handle, DWMWA_USE_IMMUTABLE_DARK_MODE, ref darkMode, sizeof(int));

        var cornerPref = DWMWCP_ROUND;
        DwmSetWindowAttribute(Handle, DWMWA_WINDOW_CORNER_PREFERENCE, ref cornerPref, sizeof(int));
    }

    protected override void OnHandleCreated(EventArgs e)
    {
        base.OnHandleCreated(e);
        ApplyWindows11GlassStyle();
    }

    private async Task InitializeWebViewAsync()
    {
        var userDataFolder = Path.Combine(_dataDir, "webview2");
        Directory.CreateDirectory(userDataFolder);

        var env = await CoreWebView2Environment.CreateAsync(null, userDataFolder);
        await _webView.EnsureCoreWebView2Async(env);

        _webView.CoreWebView2.Settings.AreDefaultContextMenusEnabled = false;
        _webView.CoreWebView2.Settings.IsStatusBarEnabled = false;

        _webView.CoreWebView2.SetVirtualHostNameToFolderMapping(
            "startupcatcher.local",
            _wwwrootDir,
            CoreWebView2HostResourceAccessKind.Allow);

        _webView.CoreWebView2.WebMessageReceived += OnWebMessageReceived;
        _webView.Source = new Uri("https://startupcatcher.local/index.html");
    }

    private void OnWebMessageReceived(object? sender, CoreWebView2WebMessageReceivedEventArgs e)
    {
        try
        {
            using var doc = JsonDocument.Parse(e.WebMessageAsJson);
            var root = doc.RootElement;
            var requestId = root.GetProperty("requestId").GetString() ?? "";
            var action = root.GetProperty("action").GetString() ?? "";
            var payload = root.TryGetProperty("payload", out var p) ? p : default;

            object result = action switch
            {
                "windowMinimize" => WindowMinimize(),
                "windowMaximize" => WindowMaximize(),
                "windowClose" => WindowClose(),
                "windowDrag" => WindowDrag(),
                "setWindowOpacity" => SetWindowOpacity(payload),
                "launchApps" => LaunchApps(payload),
                "skipSession" => SkipSession(),
                "scanAutostart" => ScanAutostart(),
                "interceptEntry" => InterceptEntry(payload),
                "restoreEntry" => RestoreEntry(payload),
                "pickExe" => PickExe(),
                _ => new { ok = false, error = $"Unknown action: {action}" }
            };

            var response = JsonSerializer.Serialize(new { requestId, result });
            _webView.CoreWebView2.PostWebMessageAsJson(response);
        }
        catch (Exception ex)
        {
            try
            {
                var err = JsonSerializer.Serialize(new { error = ex.Message });
                _webView.CoreWebView2.PostWebMessageAsJson(err);
            }
            catch { /* ignore */ }
        }
    }

    private object WindowMinimize()
    {
        BeginInvoke(() => WindowState = FormWindowState.Minimized);
        return new { ok = true };
    }

    private object WindowMaximize()
    {
        BeginInvoke(() =>
        {
            WindowState = WindowState == FormWindowState.Maximized
                ? FormWindowState.Normal
                : FormWindowState.Maximized;
        });
        return new { ok = true };
    }

    private object WindowClose()
    {
        BeginInvoke(() => Application.Exit());
        return new { ok = true };
    }

    private object WindowDrag()
    {
        BeginInvoke(() =>
        {
            ReleaseCapture();
            SendMessage(Handle, WM_NCLBUTTONDOWN, HTCAPTION, 0);
        });
        return new { ok = true };
    }

    private object SetWindowOpacity(JsonElement payload)
    {
        double percent = 85;
        if (payload.ValueKind == JsonValueKind.Object && payload.TryGetProperty("opacity", out var opEl))
        {
            if (opEl.ValueKind == JsonValueKind.Number && opEl.TryGetDouble(out var val))
            {
                percent = val;
            }
        }
        var clamped = Math.Clamp(percent / 100.0, 0.35, 1.0);
        BeginInvoke(() => Opacity = clamped);
        return new { ok = true, opacity = clamped };
    }

    private object LaunchApps(JsonElement payload)
    {
        var launched = new List<string>();
        var errors = new List<string>();

        if (payload.ValueKind == JsonValueKind.Object && payload.TryGetProperty("apps", out var appsEl))
        {
            foreach (var item in appsEl.EnumerateArray())
            {
                var name = item.TryGetProperty("name", out var n) ? n.GetString() ?? "" : "";
                var command = item.TryGetProperty("command", out var c) ? c.GetString() ?? "" : "";
                if (string.IsNullOrWhiteSpace(command))
                {
                    errors.Add($"{name}: немає команди/шляху");
                    continue;
                }

                try
                {
                    StartCommand(command);
                    launched.Add(name);
                }
                catch (Exception ex)
                {
                    errors.Add($"{name}: {ex.Message}");
                }
            }
        }

        if (launched.Count > 0 && errors.Count == 0)
        {
            _ = Task.Delay(900).ContinueWith(_ => BeginInvoke(() => Application.Exit()));
        }

        return new { launchedNames = launched, errors, skipped = false };
    }

    private static void StartCommand(string rawCommand)
    {
        var trimmed = rawCommand.Trim();
        string fileName;
        string arguments = "";

        if (trimmed.StartsWith('"'))
        {
            var endQuote = trimmed.IndexOf('"', 1);
            if (endQuote > 1)
            {
                fileName = trimmed[1..endQuote];
                arguments = trimmed[(endQuote + 1)..].Trim();
            }
            else
            {
                fileName = trimmed.Trim('"');
            }
        }
        else if (File.Exists(trimmed))
        {
            fileName = trimmed;
        }
        else
        {
            var exeIdx = trimmed.IndexOf(".exe ", StringComparison.OrdinalIgnoreCase);
            if (exeIdx > 0)
            {
                fileName = trimmed[..(exeIdx + 4)];
                arguments = trimmed[(exeIdx + 5)..].Trim();
            }
            else
            {
                fileName = trimmed;
            }
        }

        Process.Start(new ProcessStartInfo
        {
            FileName = fileName,
            Arguments = arguments,
            UseShellExecute = true
        });
    }

    private object SkipSession()
    {
        _ = Task.Delay(450).ContinueWith(_ => BeginInvoke(() => Application.Exit()));
        return new { launchedNames = Array.Empty<string>(), skipped = true };
    }

    private static bool IsSelfAutostartEntry(string name, string command)
    {
        var n = name.Trim();
        var c = command.Trim();
        return n.Contains("Startup Catcher", StringComparison.OrdinalIgnoreCase)
            || n.Contains("StartupCatcher", StringComparison.OrdinalIgnoreCase)
            || c.Contains("StartupCatcher.exe", StringComparison.OrdinalIgnoreCase)
            || c.Contains("Startup Catcher.lnk", StringComparison.OrdinalIgnoreCase);
    }

    private List<AutostartCandidate> ScanAutostart()
    {
        var activeById = new Dictionary<string, AutostartCandidate>(StringComparer.OrdinalIgnoreCase);

        using (var runKey = Registry.CurrentUser.OpenSubKey(@"Software\Microsoft\Windows\CurrentVersion\Run", false))
        {
            if (runKey != null)
            {
                foreach (var valueName in runKey.GetValueNames())
                {
                    var cmd = runKey.GetValue(valueName)?.ToString() ?? "";
                    if (string.IsNullOrWhiteSpace(cmd)) continue;
                    if (IsSelfAutostartEntry(valueName, cmd)) continue;
                    var id = $"hkcu:{valueName}";
                    activeById[id] = new AutostartCandidate(
                        id,
                        valueName,
                        "Реєстр Run",
                        cmd,
                        false,
                        false
                    );
                }
            }
        }

        var startupFolder = Environment.GetFolderPath(Environment.SpecialFolder.Startup);
        if (Directory.Exists(startupFolder))
        {
            foreach (var file in Directory.GetFiles(startupFolder))
            {
                var fileName = Path.GetFileName(file);
                if (fileName.Equals("desktop.ini", StringComparison.OrdinalIgnoreCase)) continue;
                var displayName = Path.GetFileNameWithoutExtension(file);
                if (IsSelfAutostartEntry(displayName, file)) continue;
                var id = $"startup:{fileName}";
                activeById[id] = new AutostartCandidate(
                    id,
                    displayName,
                    "Startup",
                    file,
                    false,
                    false
                );
            }
        }

        var backups = LoadInterceptedBackups();
        var list = new List<AutostartCandidate>();

        foreach (var active in activeById.Values)
        {
            var reappeared = backups.ContainsKey(active.Id);
            list.Add(active with { Reappeared = reappeared });
        }

        foreach (var (id, record) in backups)
        {
            if (activeById.ContainsKey(id)) continue;
            if (id.StartsWith("startup:", StringComparison.Ordinal))
            {
                var fileName = id[8..];
                var backupPath = Path.Combine(_backupStartupDir, fileName);
                if (!File.Exists(backupPath)) continue;
                list.Add(new AutostartCandidate(
                    id,
                    record.Name,
                    "Startup",
                    backupPath,
                    true,
                    false
                ));
            }
            else
            {
                list.Add(new AutostartCandidate(
                    id,
                    record.Name,
                    string.IsNullOrWhiteSpace(record.Source) ? "Реєстр Run" : record.Source,
                    record.Command,
                    true,
                    false
                ));
            }
        }

        return list;
    }

    private object InterceptEntry(JsonElement payload)
    {
        try
        {
            var id = payload.TryGetProperty("id", out var idEl) ? idEl.GetString() ?? "" : "";
            if (id.StartsWith("hkcu:", StringComparison.Ordinal))
            {
                var keyName = id[5..];
                using var runKey = Registry.CurrentUser.OpenSubKey(@"Software\Microsoft\Windows\CurrentVersion\Run", true);
                var cmd = runKey?.GetValue(keyName)?.ToString();
                if (runKey != null && cmd != null)
                {
                    SaveInterceptedBackup(id, keyName, "Реєстр Run", cmd);
                    runKey.DeleteValue(keyName, false);
                    return new { ok = true, id, name = keyName, source = "Реєстр Run", command = cmd };
                }
                return new { ok = false, error = $"Запис «{keyName}» не знайдено у реєстрі Run." };
            }

            if (id.StartsWith("startup:", StringComparison.Ordinal))
            {
                var fileName = id[8..];
                var src = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Startup), fileName);
                var dst = Path.Combine(_backupStartupDir, fileName);
                if (File.Exists(src))
                {
                    Directory.CreateDirectory(_backupStartupDir);
                    File.Move(src, dst, true);
                    var displayName = Path.GetFileNameWithoutExtension(fileName);
                    SaveInterceptedBackup(id, displayName, "Startup", dst);
                    return new { ok = true, id, name = displayName, source = "Startup", command = dst };
                }
                return new { ok = false, error = $"Файл «{fileName}» не знайдено в папці Startup." };
            }

            return new { ok = false, error = "Непідтримуваний тип запису автозапуску." };
        }
        catch (Exception ex)
        {
            return new { ok = false, error = ex.Message };
        }
    }

    private object RestoreEntry(JsonElement payload)
    {
        try
        {
            var id = payload.TryGetProperty("id", out var idEl) ? idEl.GetString() ?? "" : "";
            var name = payload.TryGetProperty("name", out var nEl) ? nEl.GetString() ?? "" : "";
            var command = payload.TryGetProperty("command", out var cEl) ? cEl.GetString() ?? "" : "";
            var backups = LoadInterceptedBackups();

            if (id.StartsWith("hkcu:", StringComparison.Ordinal))
            {
                if (string.IsNullOrWhiteSpace(command) && backups.TryGetValue(id, out var rec))
                {
                    command = rec.Command;
                }
                if (string.IsNullOrWhiteSpace(command))
                {
                    return new { ok = false, error = "Не знайдено збережену команду для відновлення в реєстрі." };
                }
                var keyName = id[5..];
                using var runKey = Registry.CurrentUser.OpenSubKey(@"Software\Microsoft\Windows\CurrentVersion\Run", true);
                runKey?.SetValue(keyName, command);
                RemoveInterceptedBackup(id);
                return new { ok = true };
            }

            if (id.StartsWith("startup:", StringComparison.Ordinal))
            {
                var fileName = id[8..];
                var src = Path.Combine(_backupStartupDir, fileName);
                var dst = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Startup), fileName);
                if (File.Exists(src))
                {
                    File.Move(src, dst, true);
                    RemoveInterceptedBackup(id);
                    return new { ok = true };
                }
                RemoveInterceptedBackup(id);
                return new { ok = false, error = $"Резервну копію «{fileName}» не знайдено." };
            }

            return new { ok = false, name, error = "Непідтримуваний тип запису." };
        }
        catch (Exception ex)
        {
            return new { ok = false, error = ex.Message };
        }
    }

    private object PickExe()
    {
        using var dialog = new OpenFileDialog
        {
            Title = "Оберіть програму або ярлик",
            Filter = "Програми та ярлики (*.exe;*.lnk;*.bat;*.cmd)|*.exe;*.lnk;*.bat;*.cmd|Усі файли (*.*)|*.*",
            CheckFileExists = true
        };
        if (dialog.ShowDialog(this) == DialogResult.OK)
        {
            return new
            {
                ok = true,
                name = Path.GetFileNameWithoutExtension(dialog.FileName),
                command = dialog.FileName
            };
        }
        return new { ok = false };
    }

    private Dictionary<string, InterceptedBackupRecord> LoadInterceptedBackups()
    {
        var backupFile = Path.Combine(_dataDir, "intercepted_backup.json");
        var result = new Dictionary<string, InterceptedBackupRecord>(StringComparer.OrdinalIgnoreCase);
        if (!File.Exists(backupFile)) return result;

        try
        {
            var parsed = JsonSerializer.Deserialize<Dictionary<string, InterceptedBackupRecord>>(File.ReadAllText(backupFile));
            if (parsed != null)
            {
                foreach (var (k, v) in parsed)
                {
                    result[k] = v;
                }
            }
        }
        catch { /* ignore corrupted backup */ }

        return result;
    }

    private void SaveInterceptedBackup(string id, string name, string source, string command)
    {
        var backupFile = Path.Combine(_dataDir, "intercepted_backup.json");
        var dict = LoadInterceptedBackups();
        dict[id] = new InterceptedBackupRecord(name, source, command, DateTimeOffset.Now);
        File.WriteAllText(backupFile, JsonSerializer.Serialize(dict, new JsonSerializerOptions { WriteIndented = true }));
    }

    private void RemoveInterceptedBackup(string id)
    {
        var backupFile = Path.Combine(_dataDir, "intercepted_backup.json");
        var dict = LoadInterceptedBackups();
        if (dict.Remove(id))
        {
            File.WriteAllText(backupFile, JsonSerializer.Serialize(dict, new JsonSerializerOptions { WriteIndented = true }));
        }
    }

    private sealed record InterceptedBackupRecord(
        [property: JsonPropertyName("name")] string Name,
        [property: JsonPropertyName("source")] string Source,
        [property: JsonPropertyName("command")] string Command,
        [property: JsonPropertyName("interceptedAt")] DateTimeOffset InterceptedAt
    );

    private sealed record AutostartCandidate(
        [property: JsonPropertyName("id")] string Id,
        [property: JsonPropertyName("name")] string Name,
        [property: JsonPropertyName("source")] string Source,
        [property: JsonPropertyName("command")] string Command,
        [property: JsonPropertyName("isIntercepted")] bool IsIntercepted,
        [property: JsonPropertyName("reappeared")] bool Reappeared
    );
}
