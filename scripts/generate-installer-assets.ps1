Add-Type -AssemblyName System.Drawing

$assetsDir = Join-Path $PSScriptRoot "..\assets"
$iconPath = Join-Path $assetsDir "icon_512.png"

if (-not (Test-Path $iconPath)) {
    $iconPath = Join-Path $assetsDir "icon.png"
}

# --- 1. Generate installerSidebar.bmp (164 x 314) ---
$sidebarWidth = 164
$sidebarHeight = 314

$sidebarBmp = New-Object System.Drawing.Bitmap($sidebarWidth, $sidebarHeight, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
$g = [System.Drawing.Graphics]::FromImage($sidebarBmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

# Background Gradient: Dark slate navy (#0f172a) to rich academic blue (#1e40af)
$rect = New-Object System.Drawing.Rectangle(0, 0, $sidebarWidth, $sidebarHeight)
$brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    $rect,
    [System.Drawing.Color]::FromArgb(15, 23, 42),   # #0f172a
    [System.Drawing.Color]::FromArgb(30, 64, 175),  # #1e40af
    [System.Drawing.Drawing2D.LinearGradientMode]::Vertical
)
$g.FillRectangle($brush, $rect)
$brush.Dispose()

# Ambient glow circle behind the icon
$glowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(25, 59, 130, 246)) # semi-transparent blue
$g.FillEllipse($glowBrush, 27, 25, 110, 110)
$glowBrush.Dispose()

# Draw App Icon (84 x 84)
if (Test-Path $iconPath) {
    $srcIcon = [System.Drawing.Image]::FromFile($iconPath)
    $iconX = [int](($sidebarWidth - 80) / 2)
    $g.DrawImage($srcIcon, $iconX, 35, 80, 80)
    $srcIcon.Dispose()
}

# Text formatting
$centerFormat = New-Object System.Drawing.StringFormat
$centerFormat.Alignment = [System.Drawing.StringAlignment]::Center
$centerFormat.LineAlignment = [System.Drawing.StringAlignment]::Center

# App Title: AcademiCal
$titleFont = New-Object System.Drawing.Font("Segoe UI", 15, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$titleRect = New-Object System.Drawing.RectangleF(0, 126, $sidebarWidth, 24)
$g.DrawString("AcademiCal", $titleFont, $whiteBrush, $titleRect, $centerFormat)

# Subtitle: DESKTOP
$subFont = New-Object System.Drawing.Font("Segoe UI", 9, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$accentBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(147, 197, 253)) # #93c5fd
$subRect = New-Object System.Drawing.RectangleF(0, 148, $sidebarWidth, 16)
$g.DrawString("DESKTOP", $subFont, $accentBrush, $subRect, $centerFormat)

# Divider line
$pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(59, 130, 246), 1.5)
$g.DrawLine($pen, 32, 172, 132, 172)
$pen.Dispose()

# Tagline & features
$taglineFont = New-Object System.Drawing.Font("Segoe UI", 9, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(226, 232, 240)) # #e2e8f0

$leftFormat = New-Object System.Drawing.StringFormat
$leftFormat.Alignment = [System.Drawing.StringAlignment]::Near
$leftFormat.LineAlignment = [System.Drawing.StringAlignment]::Center

$bulletX = 20
$features = @(
    "Google Calendar Sync",
    "Gestor de Entregas",
    "Modo Examenes",
    "Horario Academico"
)

$featY = 190
$checkFont = New-Object System.Drawing.Font("Segoe UI", 8, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$checkBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(52, 211, 153)) # emerald green

foreach ($feat in $features) {
    $g.DrawString(">", $checkFont, $checkBrush, $bulletX, $featY)
    $g.DrawString($feat, $taglineFont, $textBrush, ($bulletX + 12), $featY)
    $featY += 20
}

# Footer version
$versionFont = New-Object System.Drawing.Font("Segoe UI", 8, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$versionBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(148, 163, 184))
$vRect = New-Object System.Drawing.RectangleF(0, 288, $sidebarWidth, 18)
$g.DrawString("v1.0.0 * 64-bit", $versionFont, $versionBrush, $vRect, $centerFormat)

$g.Dispose()

$sidebarPath = Join-Path $assetsDir "installer-sidebar.bmp"
$sidebarBmp.Save($sidebarPath, [System.Drawing.Imaging.ImageFormat]::Bmp)
$sidebarBmp.Dispose()
Write-Output "Created: $sidebarPath"

# --- 2. Generate installerHeader.bmp (150 x 57) ---
$headerWidth = 150
$headerHeight = 57

$headerBmp = New-Object System.Drawing.Bitmap($headerWidth, $headerHeight, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
$gh = [System.Drawing.Graphics]::FromImage($headerBmp)
$gh.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$gh.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

# White background (matches NSIS header)
$gh.Clear([System.Drawing.Color]::White)

# Draw mini icon on the right side
if (Test-Path $iconPath) {
    $srcIcon = [System.Drawing.Image]::FromFile($iconPath)
    # Icon 42x42 at X=96, Y=7
    $gh.DrawImage($srcIcon, 96, 7, 42, 42)
    $srcIcon.Dispose()
}

$gh.Dispose()

$headerPath = Join-Path $assetsDir "installer-header.bmp"
$headerBmp.Save($headerPath, [System.Drawing.Imaging.ImageFormat]::Bmp)
$headerBmp.Dispose()
Write-Output "Created: $headerPath"
