# Multi-Modal Isochrone

Drop a pin anywhere on the globe and see how far you can walk *or* bike in 5–60 minutes. Elevation-aware (slope penalizes routing), stairs-aware (no bikes up steps), and side-by-side comparison view available.

**[Live demo →](https://reneebe.github.io/multi-modal-isochrone/)**

Built on top of [isochrone-map](https://github.com/ReneeBe/isochrone-map) (day 22), this swaps Mapbox's flat-earth Isochrone API for OpenRouteService, which integrates SRTM elevation into the routing graph and supports cycling profiles.

## Stack

- Vite + React + TypeScript + Tailwind v4
- Mapbox GL JS for the basemap, Mapbox Geocoding for addresses
- **OpenRouteService** for isochrones (`foot-walking` + `cycling-regular` profiles)
- Browser Geolocation API for "Use my location"
- Overpass API for POI counts inside each mode's target polygon
- turf.js for polygon subtraction (non-overlapping annular bands)

## Local dev

```bash
npm install
cp .env.example .env.local  # add your Mapbox + ORS keys
npm run dev
```

## Notes

- `cycling-regular` is the "general commuter cyclist" profile. ORS also offers `cycling-road` (paved-only), `cycling-mountain` (off-road, less slope-averse), and `cycling-electric` (motor assist, slope-tolerant).
- Walking buckets: 5/10/20/30/45/60 min. Biking buckets: 5/10/15/20/30/45 min (biking covers ~3× the ground per minute, so the buckets compress).
- Compare view (`/?view=compare`) renders both modes side-by-side on the same pin.
