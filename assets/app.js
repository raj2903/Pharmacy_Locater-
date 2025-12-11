const form = document.getElementById("search-form");
const statusEl = document.getElementById("status");
const listEl = document.getElementById("pharmacy-list");
let map;
let markers;

function initMap() {
  map = L.map("map").setView([39.8283, -98.5795], 4); // Center of contiguous US

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  markers = L.layerGroup().addTo(map);
}

async function geocodeZip(zip) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&country=USA&postalcode=${encodeURIComponent(
    zip
  )}`;
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Pharmacy-Locator-Demo",
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to lookup ZIP code");
  }

  const data = await response.json();
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("ZIP code not found");
  }

  const { lat, lon, display_name: displayName } = data[0];
  return { lat: parseFloat(lat), lon: parseFloat(lon), displayName };
}

async function fetchPharmacies(lat, lon, radiusMiles) {
  const radiusMeters = radiusMiles * 1609.34;
  const query = `[out:json][timeout:25];nwr["amenity"="pharmacy"](around:${radiusMeters},${lat},${lon});out center;`;

  const response = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    body: query,
    headers: {
      "Content-Type": "text/plain",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to query pharmacies");
  }

  const data = await response.json();
  return data.elements ?? [];
}

function updateStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.style.color = isError ? "#c53030" : "var(--muted)";
}

function renderResults(pharmacies, center) {
  markers.clearLayers();
  listEl.innerHTML = "";

  const bounds = L.latLngBounds();
  bounds.extend([center.lat, center.lon]);

  if (pharmacies.length === 0) {
    listEl.innerHTML = '<li class="empty-state">No pharmacies found in this area.</li>';
    map.setView([center.lat, center.lon], 12);
    return;
  }

  pharmacies.forEach((place, index) => {
    const lat = place.lat ?? place.center?.lat;
    const lon = place.lon ?? place.center?.lon;
    if (typeof lat !== "number" || typeof lon !== "number") return;

    const name = place.tags?.name || "Unnamed pharmacy";
    const address = [place.tags?.housenumber, place.tags?.street, place.tags?.city]
      .filter(Boolean)
      .join(" ");

    const marker = L.marker([lat, lon]).bindPopup(`<strong>${name}</strong><br>${
      address || "Address not available"
    }`);
    markers.addLayer(marker);
    bounds.extend([lat, lon]);

    const listItem = document.createElement("li");
    listItem.className = "result-item";
    listItem.innerHTML = `
      <h3>${index + 1}. ${name}</h3>
      <div class="meta">${address || "Address not available"}</div>
    `;
    listEl.appendChild(listItem);
  });

  map.fitBounds(bounds, { padding: [30, 30] });
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(form);
  const zip = (formData.get("zip") || "").toString().trim();
  const radius = Number(formData.get("radius"));

  if (!zip.match(/^\d{5}$/)) {
    updateStatus("Please enter a valid 5-digit ZIP code.", true);
    return;
  }

  updateStatus("Looking up ZIP code...");
  try {
    const location = await geocodeZip(zip);
    updateStatus(`Found ${location.displayName}. Searching for pharmacies...`);

    const pharmacies = await fetchPharmacies(location.lat, location.lon, radius);
    updateStatus(`Showing results within ${radius} miles of ${zip}.`);
    renderResults(pharmacies, location);
  } catch (error) {
    console.error(error);
    updateStatus(error.message || "Something went wrong.", true);
  }
});

initMap();
