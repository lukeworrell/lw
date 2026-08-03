Add-Type -AssemblyName System.Drawing

function New-Placeholder {
    param(
        [string]$Path,
        [int]$Width,
        [int]$Height,
        [string]$Label
    )

    $bmp = New-Object System.Drawing.Bitmap $Width, $Height
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

    # Flat mid-gray field so it's obviously a placeholder, not a real photo.
    $bg = [System.Drawing.Color]::FromArgb(190, 190, 190)
    $g.Clear($bg)

    $fontSize = [float]([Math]::Max(24, $Width / 24))
    $font = New-Object System.Drawing.Font("Arial", $fontSize, [System.Drawing.FontStyle]::Regular)
    $textColor = [System.Drawing.Color]::FromArgb(60, 60, 60)
    $brush = New-Object System.Drawing.SolidBrush $textColor

    $format = New-Object System.Drawing.StringFormat
    $format.Alignment = [System.Drawing.StringAlignment]::Center
    $format.LineAlignment = [System.Drawing.StringAlignment]::Center

    $text = "$Label`n${Width}x${Height}"
    $rect = New-Object System.Drawing.RectangleF 0, 0, $Width, $Height
    $g.DrawString($text, $font, $brush, $rect, $format)

    $dir = Split-Path -Parent $Path
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }

    $jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
    $params = New-Object System.Drawing.Imaging.EncoderParameters 1
    $params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality), 85
    $bmp.Save($Path, $jpegCodec, $params)

    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Wrote $Path"
}

$root = Split-Path -Parent $PSScriptRoot

# work/
New-Placeholder "$root\src\content\work\thesis-housing-block\cover.jpg" 2400 1600 "Thesis: Housing Block - Cover"
New-Placeholder "$root\src\content\work\thesis-housing-block\01.jpg" 1600 2000 "Thesis: Housing Block - Plan"
New-Placeholder "$root\src\content\work\thesis-housing-block\02.jpg" 2400 1600 "Thesis: Housing Block - Model"

New-Placeholder "$root\src\content\work\summer-internship-2024\cover.jpg" 2400 1600 "Internship 2024 - Cover"
New-Placeholder "$root\src\content\work\summer-internship-2024\01.jpg" 2400 1600 "Internship 2024 - Detail"

New-Placeholder "$root\src\content\work\high-school-model\cover.jpg" 2400 1600 "High School Model - Cover"

New-Placeholder "$root\src\content\work\weekend-pavilion\cover.jpg" 2400 1600 "Weekend Pavilion - Cover"
New-Placeholder "$root\src\content\work\weekend-pavilion\01.jpg" 1600 2000 "Weekend Pavilion - Detail"

# frames/photography
New-Placeholder "$root\src\content\frames\photography\coastal-series\01.jpg" 2000 2500 "Coastal Series 01"
New-Placeholder "$root\src\content\frames\photography\coastal-series\02.jpg" 2400 1600 "Coastal Series 02"
New-Placeholder "$root\src\content\frames\photography\coastal-series\03.jpg" 2000 2500 "Coastal Series 03"

# frames/band
New-Placeholder "$root\src\content\frames\band\triangle-storage-live\01.jpg" 2400 1600 "Triangle Storage - Live 01"
New-Placeholder "$root\src\content\frames\band\triangle-storage-live\02.jpg" 2400 1600 "Triangle Storage - Live 02"

Write-Host "Done."
