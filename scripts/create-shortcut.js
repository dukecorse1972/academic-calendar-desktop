const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function createShortcuts() {
  const projectRoot = path.resolve(__dirname, '..');
  const iconPath = path.join(projectRoot, 'assets', 'icon.ico');
  const electronExe = path.join(projectRoot, 'node_modules', 'electron', 'dist', 'electron.exe');
  const unpackedExe = path.join(projectRoot, 'release', 'win-unpacked', 'AcademiCal Desktop.exe');

  let targetExe = electronExe;
  let args = `"${projectRoot}"`;
  let workingDir = projectRoot;
  let iconLocation = `${iconPath},0`;

  if (fs.existsSync(unpackedExe)) {
    targetExe = unpackedExe;
    args = '';
    workingDir = path.dirname(unpackedExe);
    iconLocation = `${unpackedExe},0`;
    console.log(`[Shortcut] Found standalone unpacked executable at: ${unpackedExe}`);
  } else {
    console.log(`[Shortcut] Using local Electron runtime at: ${electronExe}`);
  }

  const appData = process.env.APPDATA || path.join(process.env.USERPROFILE, 'AppData', 'Roaming');
  const userProfile = process.env.USERPROFILE;

  const startMenuProgramsDir = path.join(appData, 'Microsoft', 'Windows', 'Start Menu', 'Programs');
  const desktopDir = path.join(userProfile, 'Desktop');

  const destinations = [
    {
      name: 'Menú de Inicio (Start Menu)',
      filePath: path.join(startMenuProgramsDir, 'AcademiCal Desktop.lnk')
    },
    {
      name: 'Escritorio (Desktop)',
      filePath: path.join(desktopDir, 'AcademiCal Desktop.lnk')
    }
  ];

  const tmpPs1 = path.join(projectRoot, 'scripts', '_temp_shortcut.ps1');

  destinations.forEach(({ name, filePath }) => {
    try {
      const psContent = [
        `$WshShell = New-Object -ComObject WScript.Shell`,
        `$Shortcut = $WshShell.CreateShortcut('${filePath.replace(/'/g, "''")}')`,
        `$Shortcut.TargetPath = '${targetExe.replace(/'/g, "''")}'`,
        `$Shortcut.Arguments = '${args.replace(/'/g, "''")}'`,
        `$Shortcut.WorkingDirectory = '${workingDir.replace(/'/g, "''")}'`,
        `$Shortcut.IconLocation = '${iconLocation.replace(/'/g, "''")}'`,
        `$Shortcut.Description = 'AcademiCal Desktop'`,
        `$Shortcut.Save()`
      ].join('\r\n');

      fs.writeFileSync(tmpPs1, psContent, 'utf8');
      execSync(`powershell -NoProfile -ExecutionPolicy Bypass -File "${tmpPs1}"`, { stdio: 'inherit' });
      if (fs.existsSync(filePath)) {
        console.log(`✅ Acceso directo creado en ${name}: ${filePath}`);
      }
    } catch (err) {
      console.error(`❌ Error creando acceso directo en ${name}:`, err.message);
    } finally {
      if (fs.existsSync(tmpPs1)) {
        try { fs.unlinkSync(tmpPs1); } catch (_) {}
      }
    }
  });

  console.log('\n🎉 ¡AcademiCal Desktop ya está disponible en el Menú de Inicio y en el Escritorio!');
  console.log('👉 Ya no necesitas abrir la terminal ni hacer "npm start". Simplemente haz clic en el icono de AcademiCal Desktop.');
}

createShortcuts();
