# Pharmacy Locator

A lightweight, browser-based tool that uses OpenStreetMap data to find pharmacies near a U.S. ZIP code. Enter a ZIP code and search radius (miles) to center the map, display matching pharmacies, and list them beside the map.

## Features
- ZIP code lookup via Nominatim to center the map.
- Overpass API query for nearby pharmacies within a configurable radius.
- Leaflet-powered map with markers and popups.
- Accessible list of pharmacies with names and addresses.

## Getting started
1. Open `index.html` in a modern browser (no build step required).
2. Provide a 5-digit ZIP code and a search radius in miles.
3. Submit the form to pan/zoom the map and see pharmacies plotted alongside a detailed list.

> Note: Results depend on OpenStreetMap coverage and the Overpass API; rate limits may apply.
