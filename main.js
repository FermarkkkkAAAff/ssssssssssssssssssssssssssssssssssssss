const tableBody = document.querySelector("#results tbody");
let allData = [];

async function fetchLinks() {
  try {
    const res = await fetch("links.txt");
    const text = await res.text();
    const links = text.split("\n").filter(l => l.trim().startsWith("http"));
    for (const link of links) {
      await loadSheetData(link.trim());
    }
    renderTable();
  } catch (e) {
    console.error("Chyba při načítání links.txt:", e);
  }
}

async function loadSheetData(csvUrl) {
  try {
    const response = await fetch(csvUrl);
    const text = await response.text();
    const rows = text.split("\n").map(r => r.split(","));

    const headers = rows[0].map(h => h.trim().toLowerCase());
    const nameIdx = headers.findIndex(h => h.includes("název"));
    const priceIdx = headers.findIndex(h => h.includes("kaobuy"));
    const atfIdx = headers.findIndex(h => h.includes("atf"));

    if (nameIdx === -1) {
      console.warn("Sloupec 'název' nebyl nalezen v:", csvUrl);
      return;
    }

    rows.slice(1).forEach(row => {
      const name = row[nameIdx]?.trim();
      if (!name) return;

      const priceLink = row[priceIdx]?.trim();
      const atf = row[atfIdx]?.trim().toLowerCase();

      const found = allData.find(item => item.name === name);
      if (found) {
        found.sheets.push(csvUrl);
      } else {
        allData.push({ name, priceLink, atf, sheets: [csvUrl] });
      }
    });
  } catch (e) {
    console.error("Chyba při načítání CSV:", csvUrl, e);
  }
}

function renderTable() {
  const search = document.getElementById("search").value.toLowerCase();
  const filter = document.getElementById("atfFilter").value;
  tableBody.innerHTML = "";

  for (const item of allData) {
    if (search && !item.name.toLowerCase().includes(search)) continue;
    if (filter && item.atf !== filter) continue;

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.name}</td>
      <td>${item.priceLink ? `<a href="${item.priceLink}" target="_blank">Zobrazit</a>` : ""}</td>
      <td>${item.sheets.length}</td>
      <td>${item.atf || ""}</td>
    `;
    tableBody.appendChild(row);
  }
}

function sortTable(colIndex) {
  const keys = ["name", "priceLink", "sheets", "atf"];
  const key = keys[colIndex];
  const asc = !sortTable[`asc_${colIndex}`];
  sortTable[`asc_${colIndex}`] = asc;

  allData.sort((a, b) => {
    const aVal = key === "sheets" ? a.sheets.length : (a[key] || "");
    const bVal = key === "sheets" ? b.sheets.length : (b[key] || "");
    return asc
      ? aVal.toString().localeCompare(bVal.toString())
      : bVal.toString().localeCompare(aVal.toString());
  });

  renderTable();
}

document.getElementById("search").addEventListener("input", renderTable);
document.getElementById("atfFilter").addEventListener("change", renderTable);

fetchLinks();
