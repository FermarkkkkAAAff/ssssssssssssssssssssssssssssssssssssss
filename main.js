const tableBody = document.querySelector("#results tbody");
let allItems = [];

async function fetchLinks() {
  const res = await fetch("links.txt");
  const links = (await res.text()).split("\n").map(l => l.trim()).filter(l => l.startsWith("http"));
  for (const link of links) {
    await loadCSV(link);
  }
  document.getElementById("loading").style.display = "none";
  renderTable();
}

async function loadCSV(url) {
  try {
    const res = await fetch(url);
    const text = await res.text();
    const rows = text.split("\n").map(r => r.split(",").map(cell => cell.trim()));

    if (rows.length < 2) return;

    const headers = rows[0].map(h => h.toLowerCase());

    const nameIdx = headers.findIndex(h => h.includes("název") || h.includes("name") || h.includes("produkt"));
    const priceIdx = headers.findIndex(h => h.includes("cena") || h.includes("price") || h.includes("kaobuy"));
    const imageIdx = headers.findIndex(h => h.includes("obrázek") || h.includes("img") || h.includes("image"));
    const linkIdx = headers.findIndex(h => h.includes("odkaz") || h.includes("link") || h.includes("url"));

    if (nameIdx === -1) return;

    rows.slice(1).forEach(row => {
      const name = row[nameIdx] || "";
      if (!name) return;
      allItems.push({
        name,
        image: imageIdx !== -1 ? row[imageIdx] : "",
        price: priceIdx !== -1 ? row[priceIdx] : "",
        link: linkIdx !== -1 ? row[linkIdx] : ""
      });
    });
  } catch (err) {
    console.error("Chyba při načítání CSV:", url, err);
  }
}

function renderTable() {
  const query = document.getElementById("search").value.toLowerCase();
  tableBody.innerHTML = "";

  allItems
    .filter(item => item.name.toLowerCase().includes(query))
    .forEach(item => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${item.name}</td>
        <td>${item.image ? `<img src="${item.image}" alt="obrázek">` : ""}</td>
        <td>${item.price}</td>
        <td>${item.link ? `<a href="${item.link}" target="_blank" class="button">Zobrazit</a>` : ""}</td>
      `;
      tableBody.appendChild(row);
    });
}

document.getElementById("search").addEventListener("input", renderTable);
fetchLinks();
