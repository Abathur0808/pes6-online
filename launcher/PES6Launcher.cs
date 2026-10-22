// ============================================================
// PES 6 Online — Launcher de escritorio (C# / WinForms)
// Compilar: csc /target:winexe /out:PES6-Launcher.exe /r:System.dll,System.Drawing.dll,System.Windows.Forms.dll,System.Runtime.Serialization.dll PES6Launcher.cs
// Configura la red (hosts) y lanza PES 6. Mismo comportamiento que PES6-Launcher.ps1.
// ============================================================
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Net;
using System.Runtime.Serialization;
using System.Runtime.Serialization.Json;
using System.Security.Principal;
using System.Text;
using System.Windows.Forms;

[DataContract]
public class ServerPreset {
    [DataMember] public string name = "";
    [DataMember] public string gateIp = "";
    [DataMember] public string stunIp = "";
    [DataMember] public string signupUrl = "";
    [DataMember] public string note = "";
}

[DataContract]
public class LauncherConfig {
    [DataMember] public string gameDir = @"D:\Games\pech\PECH CLASSIC PATCH";
    [DataMember] public List<string> exeCandidates = new List<string> { "PECHCP.exe", "PES6.exe" };
    [DataMember] public string gateHost = "pes6gate-ec.winning-eleven.net";
    [DataMember] public string stunHost = "we9stun.winning-eleven.net";
    [DataMember] public string selectedServer = "";
    [DataMember] public string serversUrl = "";
    [DataMember] public List<ServerPreset> servers = new List<ServerPreset>();
}

public class LauncherForm : Form {
    static readonly string LauncherDir = AppDomain.CurrentDomain.BaseDirectory;
    static readonly string ConfigPath = Path.Combine(LauncherDir, "launcher.config.json");
    static readonly string HostsPath = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.System), @"drivers\etc\hosts");
    const string MarkerBegin = "# PES6-ONLINE BEGIN";
    const string MarkerEnd = "# PES6-ONLINE END";

    LauncherConfig cfg;
    TextBox gameDirBox, gateIpBox, stunIpBox;
    ComboBox serverCombo;
    Label serverNote, statusLabel;
    Button signupBtn;

    static readonly Color Bg = Color.FromArgb(17, 17, 19);
    static readonly Color Panel = Color.FromArgb(38, 38, 43);
    static readonly Color Fg = Color.FromArgb(237, 237, 237);
    static readonly Color Dim = Color.FromArgb(156, 163, 175);
    static readonly Color Green = Color.FromArgb(22, 163, 74);
    static readonly Color GreenLight = Color.FromArgb(74, 222, 128);
    static readonly Color Gold = Color.FromArgb(234, 179, 8);
    static readonly Color Red = Color.FromArgb(239, 68, 68);

    public LauncherForm() {
        cfg = LoadConfig();

        Text = "PES 6 Online Launcher";
        ClientSize = new Size(500, 430);
        StartPosition = FormStartPosition.CenterScreen;
        FormBorderStyle = FormBorderStyle.FixedSingle;
        MaximizeBox = false;
        BackColor = Bg;
        ForeColor = Fg;
        Font = new Font("Segoe UI", 9f);

        int y = 14;
        var title = new Label {
            Text = "PES 6 ONLINE", Font = new Font("Segoe UI", 18f, FontStyle.Bold),
            ForeColor = Green, AutoSize = true
        };
        title.Location = new Point((ClientSize.Width - title.PreferredWidth) / 2, y);
        Controls.Add(title); y += 48;

        Controls.Add(MakeLabel("Carpeta del juego", 16, y));
        gameDirBox = MakeBox(16, y + 18, 390); gameDirBox.Text = cfg.gameDir;
        var browse = MakeButton("…", 412, y + 17, 45, 24, Dim, Panel);
        browse.Click += (s, e) => {
            var dlg = new FolderBrowserDialog { SelectedPath = gameDirBox.Text };
            if (dlg.ShowDialog() == DialogResult.OK) gameDirBox.Text = dlg.SelectedPath;
        };
        Controls.Add(browse); y += 58;

        Controls.Add(MakeLabel("Servidor", 16, y));
        serverCombo = new ComboBox {
            Location = new Point(16, y + 18), Width = 240, DropDownStyle = ComboBoxStyle.DropDownList,
            BackColor = Panel, ForeColor = Fg, FlatStyle = FlatStyle.Flat
        };
        foreach (var s in cfg.servers) serverCombo.Items.Add(s.name);
        serverCombo.SelectedIndexChanged += (s, e) => SelectServer(serverCombo.SelectedItem as string);
        Controls.Add(serverCombo);

        signupBtn = MakeButton("Crear cuenta en el servidor", 272, y + 17, 200, 24, GreenLight, Panel);
        signupBtn.Click += (s, e) => {
            var srv = CurrentServer();
            if (srv != null && srv.signupUrl.Length > 0) Process.Start(srv.signupUrl);
        };
        Controls.Add(signupBtn); y += 58;

        Controls.Add(MakeLabel("IP del servidor (gate)", 16, y));
        Controls.Add(MakeLabel("IP del servidor STUN", 272, y));
        gateIpBox = MakeBox(16, y + 18, 240);
        stunIpBox = MakeBox(272, y + 18, 200);
        y += 54;

        serverNote = new Label {
            Location = new Point(16, y), Size = new Size(470, 34),
            ForeColor = Color.FromArgb(107, 114, 128), Font = new Font("Segoe UI", 8f)
        };
        Controls.Add(serverNote); y += 44;

        var online = MakeButton("JUGAR ONLINE", 60, y, 190, 38, Color.FromArgb(10, 10, 11), Green);
        online.Font = new Font("Segoe UI", 10f, FontStyle.Bold);
        online.Click += (s, e) => PlayOnline();
        var offline = MakeButton("JUGAR OFFLINE", 260, y, 190, 38, Fg, Panel);
        offline.Font = new Font("Segoe UI", 10f, FontStyle.Bold);
        offline.Click += (s, e) => PlayOffline();
        Controls.Add(online); Controls.Add(offline); y += 50;

        var restore = MakeButton("Restaurar hosts", 60, y, 185, 28, Dim, Panel);
        restore.Click += (s, e) => RestoreHosts();
        var update = MakeButton("Actualizar servidores", 265, y, 185, 28, Dim, Panel);
        update.Click += (s, e) => UpdateServers();
        Controls.Add(restore); Controls.Add(update); y += 44;

        statusLabel = new Label {
            Location = new Point(16, y), Size = new Size(470, 50), ForeColor = Dim
        };
        Controls.Add(statusLabel);

        int idx = cfg.servers.FindIndex(s => s.name == cfg.selectedServer);
        serverCombo.SelectedIndex = idx >= 0 ? idx : 0;
        if (serverCombo.SelectedIndex >= 0) SelectServer(serverCombo.SelectedItem as string);

        var exe = FindGameExe();
        SetStatus(exe != null ? "Ejecutable detectado: " + exe
                              : "AVISO: no se encontro el ejecutable del juego.",
                  exe != null ? Dim : Gold);
    }

    // ---------- UI helpers ----------
    Label MakeLabel(string t, int x, int y) {
        return new Label { Text = t, Location = new Point(x, y), AutoSize = true, ForeColor = Dim };
    }

    TextBox MakeBox(int x, int y, int w) {
        var b = new TextBox {
            Location = new Point(x, y), Width = w,
            BackColor = Color.FromArgb(26, 26, 29), ForeColor = Fg,
            BorderStyle = BorderStyle.FixedSingle
        };
        Controls.Add(b);
        return b;
    }

    Button MakeButton(string t, int x, int y, int w, int h, Color fg, Color bg) {
        return new Button {
            Text = t, Location = new Point(x, y), Size = new Size(w, h),
            ForeColor = fg, BackColor = bg, FlatStyle = FlatStyle.Flat
        };
    }

    void SetStatus(string msg, Color c) {
        statusLabel.Text = msg;
        statusLabel.ForeColor = c;
    }

    // ---------- Config ----------
    static LauncherConfig LoadConfig() {
        try {
            if (File.Exists(ConfigPath)) {
                var ser = new DataContractJsonSerializer(typeof(LauncherConfig));
                using (var fs = File.OpenRead(ConfigPath))
                    return (LauncherConfig)ser.ReadObject(fs);
            }
        } catch { }
        return new LauncherConfig();
    }

    void SaveConfig() {
        cfg.gameDir = gameDirBox.Text.Trim();
        cfg.selectedServer = serverCombo.SelectedItem as string ?? "";
        var srv = CurrentServer();
        if (srv != null) {
            srv.gateIp = gateIpBox.Text.Trim();
            srv.stunIp = stunIpBox.Text.Trim();
        }
        try {
            var ser = new DataContractJsonSerializer(typeof(LauncherConfig));
            using (var fs = File.Create(ConfigPath)) {
                ser.WriteObject(fs, cfg);
            }
        } catch { }
    }

    ServerPreset CurrentServer() {
        var name = serverCombo.SelectedItem as string;
        return cfg.servers.Find(s => s.name == name);
    }

    void SelectServer(string name) {
        var srv = cfg.servers.Find(s => s.name == name);
        if (srv == null) return;
        gateIpBox.Text = srv.gateIp;
        stunIpBox.Text = srv.stunIp;
        serverNote.Text = srv.note;
        signupBtn.Visible = srv.signupUrl.Length > 0;
    }

    // ---------- Juego ----------
    string FindGameExe() {
        foreach (var exe in cfg.exeCandidates) {
            var p = Path.Combine(gameDirBox.Text.Trim(), exe);
            if (File.Exists(p)) return p;
        }
        return null;
    }

    static bool IsAdmin() {
        var id = WindowsIdentity.GetCurrent();
        return new WindowsPrincipal(id).IsInRole(WindowsBuiltInRole.Administrator);
    }

    bool ElevateIfNeeded() {
        if (IsAdmin()) return true;
        var r = MessageBox.Show(
            "Escribir el archivo hosts requiere administrador.\n¿Reiniciar el launcher elevado?",
            "PES 6 Online Launcher", MessageBoxButtons.YesNo, MessageBoxIcon.Question);
        if (r == DialogResult.Yes) {
            Process.Start(new ProcessStartInfo {
                FileName = Application.ExecutablePath,
                Verb = "runas",
                UseShellExecute = true
            });
            Application.Exit();
        }
        return false;
    }

    // ---------- hosts ----------
    static void RemoveManagedBlock() {
        var lines = File.ReadAllLines(HostsPath);
        var outLines = new List<string>();
        bool inside = false;
        foreach (var l in lines) {
            if (l.Contains(MarkerBegin)) { inside = true; continue; }
            if (l.Contains(MarkerEnd)) { inside = false; continue; }
            if (!inside) outLines.Add(l);
        }
        File.WriteAllLines(HostsPath, outLines.ToArray(), Encoding.ASCII);
    }

    static void FlushDns() {
        Process.Start(new ProcessStartInfo {
            FileName = "ipconfig", Arguments = "/flushdns",
            CreateNoWindow = true, UseShellExecute = false
        });
    }

    void PlayOnline() {
        SaveConfig();
        var gateIp = gateIpBox.Text.Trim();
        var stunIp = stunIpBox.Text.Trim();
        if (gateIp.Length == 0 || stunIp.Length == 0) {
            SetStatus("Faltan las IPs del servidor gate y/o STUN.", Gold); return;
        }
        var exe = FindGameExe();
        if (exe == null) {
            SetStatus("No se encontro " + string.Join("/", cfg.exeCandidates) +
                      " en " + cfg.gameDir, Red); return;
        }
        if (!ElevateIfNeeded()) return;
        try {
            RemoveManagedBlock();
            File.AppendAllLines(HostsPath, new[] {
                MarkerBegin,
                gateIp + " " + cfg.gateHost,
                stunIp + " " + cfg.stunHost,
                MarkerEnd
            }, Encoding.ASCII);
            FlushDns();
            Process.Start(new ProcessStartInfo {
                FileName = exe, WorkingDirectory = Path.GetDirectoryName(exe)
            });
            SetStatus("Hosts → " + gateIp + ". Juego lanzado. En la pantalla de red: usuario-contraseña.",
                      GreenLight);
        } catch (Exception ex) {
            SetStatus("Error al escribir hosts: " + ex.Message, Red);
        }
    }

    void PlayOffline() {
        SaveConfig();
        var exe = FindGameExe();
        if (exe == null) {
            SetStatus("No se encontro el ejecutable en " + cfg.gameDir, Red); return;
        }
        if (IsAdmin()) { try { RemoveManagedBlock(); FlushDns(); } catch { } }
        Process.Start(new ProcessStartInfo {
            FileName = exe, WorkingDirectory = Path.GetDirectoryName(exe)
        });
        SetStatus("Juego lanzado en modo offline (hosts restaurado si habia permisos).", GreenLight);
    }

    void RestoreHosts() {
        if (!ElevateIfNeeded()) return;
        try {
            RemoveManagedBlock();
            FlushDns();
            SetStatus("Entradas PES6-ONLINE eliminadas del archivo hosts.", GreenLight);
        } catch (Exception ex) {
            SetStatus("Error: " + ex.Message, Red);
        }
    }

    void UpdateServers() {
        if (cfg.serversUrl.Length == 0) {
            SetStatus("No hay URL de servidores configurada (serversUrl).", Gold); return;
        }
        try {
            ServicePointManager.SecurityProtocol = SecurityProtocolType.Tls12;
            string json;
            using (var wc = new WebClient())
                json = wc.DownloadString(cfg.serversUrl);

            var ser = new DataContractJsonSerializer(typeof(LauncherConfig));
            LauncherConfig remote;
            using (var ms = new MemoryStream(Encoding.UTF8.GetBytes(json)))
                remote = (LauncherConfig)ser.ReadObject(ms);
            if (remote.servers == null || remote.servers.Count == 0)
                throw new Exception("respuesta sin lista de servidores");

            cfg.servers = remote.servers;
            SaveConfig();
            serverCombo.Items.Clear();
            foreach (var s in cfg.servers) serverCombo.Items.Add(s.name);
            serverCombo.SelectedIndex = 0;
            SelectServer(serverCombo.SelectedItem as string);
            SetStatus("Lista de servidores actualizada desde la web.", GreenLight);
        } catch (Exception ex) {
            SetStatus("No se pudo descargar la lista: " + ex.Message, Red);
        }
    }

    [STAThread]
    public static void Main() {
        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);
        Application.Run(new LauncherForm());
    }
}
