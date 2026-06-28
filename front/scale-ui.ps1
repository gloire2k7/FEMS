# Scale up text sizes, padding and spacing across ALL admin + related HTML pages
$adminFiles = @(
  "src\app\pages\admin-dashboard\admin-dashboard.component.html",
  "src\app\pages\admin-add-extinguisher\admin-add-extinguisher.html",
  "src\app\pages\admin-assigned-inspections\admin-assigned-inspections.html",
  "src\app\pages\admin-compliance\admin-compliance.html",
  "src\app\pages\admin-inspection-label\admin-inspection-label.html",
  "src\app\pages\admin-inspectors\admin-inspectors.html",
  "src\app\pages\admin-inventory\admin-inventory.html",
  "src\app\pages\admin-location-details\admin-location-details.html",
  "src\app\pages\admin-locations-dashboard\admin-locations-dashboard.html",
  "src\app\pages\admin-orders\admin-orders.html",
  "src\app\pages\admin-refills\admin-refills.html",
  "src\app\pages\admin-settings\admin-settings.html",
  "src\app\pages\admin-view-extinguisher\admin-view-extinguisher.component.html",
  "src\app\pages\clients-dashboard\clients-dashboard.html",
  "src\app\pages\client-clients\client-clients.html",
  "src\app\pages\super-admin-dashboard\super-admin-dashboard.html",
  "src\app\pages\super-admin-admins\super-admin-admins.html",
  "src\app\pages\super-admin-clients\super-admin-clients.html",
  "src\app\pages\super-admin-admin-details\super-admin-admin-details.html",
  "src\app\pages\super-admin-client-details\super-admin-client-details.html",
  "src\app\pages\super-admin-reports\super-admin-reports.html",
  "src\app\pages\super-admin-logs\super-admin-logs.html",
  "src\app\pages\super-admin-add-admin\super-admin-add-admin.html"
)

# Text size upgrades (ordered largest-first to avoid double-replacement)
$textReplacements = @(
  @{ From = 'text-\[15px\]'; To = 'text-[19px]' },
  @{ From = 'text-\[14px\]'; To = 'text-[18px]' },
  @{ From = 'text-\[13px\]'; To = 'text-[16px]' },
  @{ From = 'text-\[12px\]'; To = 'text-[15px]' },
  @{ From = 'text-\[11px\]'; To = 'text-[14px]' },
  @{ From = 'text-\[10px\]'; To = 'text-[13px]' },
  @{ From = 'text-\[9px\]';  To = 'text-[12px]' },
  @{ From = 'text-\[8px\]';  To = 'text-[11px]' }
)

# Heading size upgrades
$headingReplacements = @(
  @{ From = 'text-\[28px\]'; To = 'text-[36px]' },
  @{ From = 'text-\[24px\]'; To = 'text-[30px]' },
  @{ From = 'text-\[20px\]'; To = 'text-[26px]' },
  @{ From = 'text-xl';       To = 'text-2xl' },
  @{ From = 'text-2xl';      To = 'text-3xl' }
)

# Icon size upgrades
$iconReplacements = @(
  @{ From = 'icon-xs'; To = 'icon-sm' },
  @{ From = 'w-3 h-3\b'; To = 'w-4 h-4' },
  @{ From = 'w-3\.5 h-3\.5'; To = 'w-5 h-5' },
  @{ From = 'w-4 h-4\b'; To = 'w-5 h-5' },
  @{ From = 'w-5 h-5\b'; To = 'w-6 h-6' }
)

# Padding / spacing upgrades
$spacingReplacements = @(
  @{ From = 'px-3 py-2\.5'; To = 'px-4 py-3' },
  @{ From = 'px-3 py-2\b';  To = 'px-4 py-3' },
  @{ From = 'px-4 py-2\b';  To = 'px-5 py-3' },
  @{ From = 'px-3 py-1\.5'; To = 'px-4 py-2' },
  @{ From = 'px-2 py-1\b';  To = 'px-3 py-1.5' },
  @{ From = '\bp-4\b';       To = 'p-6' },
  @{ From = '\bp-5\b';       To = 'p-7' },
  @{ From = '\bp-6\b';       To = 'p-8' },
  @{ From = 'gap-2\b';       To = 'gap-3' },
  @{ From = 'gap-3\b';       To = 'gap-4' },
  @{ From = 'gap-4\b';       To = 'gap-5' },
  @{ From = 'mb-2\b';        To = 'mb-3' },
  @{ From = 'mb-3\b';        To = 'mb-4' },
  @{ From = 'mb-4\b';        To = 'mb-5' },
  @{ From = 'mb-5\b';        To = 'mb-6' },
  @{ From = 'mt-2\b';        To = 'mt-3' },
  @{ From = 'mt-4\b';        To = 'mt-5' },
  @{ From = 'space-y-1\b';   To = 'space-y-2' },
  @{ From = 'space-y-2\b';   To = 'space-y-3' }
)

$allReplacements = $textReplacements + $headingReplacements + $spacingReplacements

foreach ($filePath in $adminFiles) {
  $fullPath = Join-Path $PSScriptRoot $filePath
  if (-not (Test-Path $fullPath)) {
    Write-Host "SKIP (not found): $filePath"
    continue
  }

  $content = Get-Content $fullPath -Raw -Encoding UTF8

  foreach ($rep in $allReplacements) {
    $content = [regex]::Replace($content, $rep.From, $rep.To)
  }

  Set-Content $fullPath $content -Encoding UTF8 -NoNewline
  Write-Host "UPDATED: $filePath"
}

Write-Host "`nDone! All admin pages scaled up."
