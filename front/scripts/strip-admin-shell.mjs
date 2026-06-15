import fs from 'fs';
import path from 'path';

const pagesDir = path.resolve('src/app/pages');

function findMatchingDivClose(html, startIdx) {
  let depth = 0;
  let i = startIdx;
  while (i < html.length) {
    if (html.startsWith('<div', i)) {
      depth++;
      i = html.indexOf('>', i) + 1;
    } else if (html.startsWith('</div>', i)) {
      depth--;
      i += 6;
      if (depth === 0) return i;
    } else {
      i++;
    }
  }
  return -1;
}

function unwrapOuterDiv(html) {
  const trimmed = html.trim();
  if (!trimmed.startsWith('<div')) return trimmed;
  const openEnd = trimmed.indexOf('>') + 1;
  const closeEnd = findMatchingDivClose(trimmed, 0);
  if (closeEnd === -1) return trimmed;
  return trimmed.slice(openEnd, closeEnd - 6).trim();
}

function stripFile(filePath) {
  let html = fs.readFileSync(filePath, 'utf8');
  const headerEnd = html.indexOf('</header>');
  if (headerEnd === -1) {
    console.warn('SKIP (no header):', filePath);
    return;
  }

  const contentStart = headerEnd + '</header>'.length;
  const mainEnd = html.indexOf('</main>', contentStart);
  if (mainEnd === -1) {
    console.warn('SKIP (no main):', filePath);
    return;
  }

  let inner = html.slice(contentStart, mainEnd).trim();
  inner = unwrapOuterDiv(inner);
  // Some pages have flex wrapper with sidebar inside — unwrap once more if still a single outer flex div
  if (inner.startsWith('<div class="flex flex-1')) {
    inner = unwrapOuterDiv(inner);
  }

  const afterMain = html.slice(mainEnd + '</main>'.length);
  const modals = afterMain.replace(/^\s*<\/div>\s*/i, '').trim();

  const result = `<div class="client-page max-w-6xl pb-8">\n${inner}\n</div>${modals ? '\n' + modals : ''}\n`;
  fs.writeFileSync(filePath, result, 'utf8');
  console.log('OK:', path.relative(pagesDir, filePath));
}

const files = [
  'admin-inventory/admin-inventory.html',
  'admin-orders/admin-orders.html',
  'admin-settings/admin-settings.html',
  'admin-compliance/admin-compliance.html',
  'admin-refills/admin-refills.html',
  'admin-inspectors/admin-inspectors.html',
  'admin-assigned-inspections/admin-assigned-inspections.html',
  'admin-locations-dashboard/admin-locations-dashboard.html',
  'admin-location-details/admin-location-details.html',
  'admin-add-extinguisher/admin-add-extinguisher.html',
  'admin-view-extinguisher/admin-view-extinguisher.component.html',
  'admin-inspection-label/admin-inspection-label.html',
  'clients-dashboard/clients-dashboard.html',
];

for (const rel of files) {
  stripFile(path.join(pagesDir, rel));
}
