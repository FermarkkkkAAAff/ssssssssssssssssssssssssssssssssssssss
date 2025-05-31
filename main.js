const API_KEY = 'AIzaSyBmC_vMjkKrlvVBmY4rFfekrZxuJPdN_EI';

document.addEventListener('DOMContentLoaded', fetchLinks);

async function fetchLinks() {
  try {
    const res = await fetch('links.txt');
    const text = await res.text();
    const urls = text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length && line.includes('docs.google.com'));

    for (const url of urls) {
      const sheetId = extractSheetId(url);
      if (sheetId) {
        await loadFromSheetAPI(sheetId, url);
      } else {
        console.warn('Neplatný odkaz:', url);
      }
    }
  } catch (err) {
    console.error('Chyba při načítání links.txt:', err);
  }
}

function extractSheetId(url) {
  const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

async function loadFromSheetAPI(sheetId, sourceUrl) {
  try {
    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?includeGridData=true&key=${API_KEY}`);
    const data = await res.json();

    if (!data.sheets) {
      console.warn('Žádné listy v:', sourceUrl);
      return;
    }

    for (const sheet of data.sheets) {
      const rows = sheet.data[0]?.rowData || [];

      const headers = rows[0]?.values?.map(cell => cell.formattedValue?.toLowerCase()?.trim() || '') || [];

      for (let i = 1; i < rows.length; i++) {
        const values = rows[i]?.values || [];
        const product = {};

        for (let j = 0; j < headers.length; j++) {
          const key = headers[j];
          const value = values[j]?.formattedValue || '';
          product[key] = value;
        }

        // Minimální požadované hodnoty
        const name = product['název'] || product['name'] || '';
        const price = product['cena'] || product['price'] || '';
        const image = product['obrázek'] || product['image'] || '';
        const link = product['odkaz'] || product['link'] || '';

        if (name && price) {
          renderProduct({ name, price, image, link, source: sheet.properties.title });
        }
      }
    }
  } catch (err) {
    console.error(`Chyba při načítání: https://docs.google.com/spreadsheets/d/${sheetId}`, err);
  }
}

function renderProduct({ name, price, image, link, source }) {
  const container = document.getElementById('product-list');
  if (!container) {
    console.error('Element #product-list nebyl nalezen v HTML.');
    return;
  }

  const div = document.createElement('div');
  div.className = 'product';

  div.innerHTML = `
    ${image ? `<img src="${image}" alt="${name}">` : ''}
    <h3>${name}</h3>
    <p>Cena: ${price}</p>
    ${link ? `<a href="${link}" target="_blank">Zobrazit</a>` : ''}
    <p style="font-size: 0.8em; color: #666;">Sheet: ${source}</p>
  `;

  container.appendChild(div);
}
