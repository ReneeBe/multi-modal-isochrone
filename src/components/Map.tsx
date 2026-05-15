import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { MAPBOX_TOKEN, type LngLat } from '../lib/mapbox';
import type { IsochroneFeatureCollection } from '../lib/ors';

mapboxgl.accessToken = MAPBOX_TOKEN;

type Theme = 'light' | 'dark';

type Props = {
  pin: LngLat | null;
  isochrones: IsochroneFeatureCollection | null;
  onMapClick: (point: LngLat) => void;
  theme: Theme;
  placeName: string | null;
};

const ISOCHRONE_SOURCE = 'isochrone-source';
const ISOCHRONE_FILL_LAYER = 'isochrone-fill';

const STYLE_URL: Record<Theme, string> = {
  dark: 'mapbox://styles/mapbox/dark-v11',
  light: 'mapbox://styles/mapbox/light-v11',
};

const CONTAINER_BG: Record<Theme, string> = {
  dark: '#0b0d12',
  light: '#f5f5f7',
};

export function Map({ pin, isochrones, onMapClick, theme, placeName }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const lastThemeRef = useRef<Theme>(theme);
  const onMapClickRef = useRef(onMapClick);
  onMapClickRef.current = onMapClick;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: STYLE_URL[theme],
      center: [-118.4912, 34.0195],
      zoom: 12.5,
      pitch: 0,
      attributionControl: false,
    });
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right');
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right');

    map.on('load', () => {
      map.resize();
      map.addSource(ISOCHRONE_SOURCE, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      // Concentric color bands — no outlines, smooth gradient appearance.
      // fill-opacity transitions for a soft fade-in on new isochrones.
      map.addLayer({
        id: ISOCHRONE_FILL_LAYER,
        type: 'fill',
        source: ISOCHRONE_SOURCE,
        paint: {
          'fill-color': ['get', 'fill'],
          'fill-opacity': 0,
          'fill-opacity-transition': { duration: 450, delay: 0 },
          'fill-antialias': true,
        },
      });
    });

    map.on('error', (e) => {
      console.error('Mapbox error:', e?.error?.message ?? e);
    });

    map.on('click', (e) => {
      onMapClickRef.current({ lng: e.lngLat.lng, lat: e.lngLat.lat });
    });

    map.getCanvas().style.cursor = 'crosshair';

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
    if (popupRef.current) {
      popupRef.current.remove();
      popupRef.current = null;
    }

    if (pin) {
      const el = document.createElement('div');
      el.className = 'pin';
      el.style.cssText = `
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: #fff;
        border: 3px solid #aa3bff;
        box-shadow: 0 0 0 6px rgba(170, 59, 255, 0.18), 0 4px 12px rgba(0, 0, 0, 0.45);
        cursor: pointer;
      `;
      markerRef.current = new mapboxgl.Marker({ element: el })
        .setLngLat([pin.lng, pin.lat])
        .addTo(map);

      map.flyTo({ center: [pin.lng, pin.lat], zoom: 13.5, speed: 1.2, curve: 1.4 });
    }
  }, [pin]);

  // Attach (or update) a popup on the marker when the place name resolves.
  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker || !pin) return;

    if (popupRef.current) {
      popupRef.current.remove();
      popupRef.current = null;
    }
    if (!placeName) return;

    const popup = new mapboxgl.Popup({
      offset: 18,
      closeButton: false,
      closeOnClick: false,
      className: 'isochrone-popup',
    }).setText(placeName);

    marker.setPopup(popup);
  }, [placeName, pin]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const apply = () => {
      const src = map.getSource(ISOCHRONE_SOURCE) as mapboxgl.GeoJSONSource | undefined;
      if (!src) return;

      const hasData = !!isochrones && isochrones.features.length > 0;
      if (!hasData) {
        // Fade out, then clear data after the transition.
        if (map.getLayer(ISOCHRONE_FILL_LAYER)) {
          map.setPaintProperty(ISOCHRONE_FILL_LAYER, 'fill-opacity', 0);
        }
        src.setData({ type: 'FeatureCollection', features: [] });
        return;
      }

      // Set new data invisibly first, then fade in on the next frame.
      if (map.getLayer(ISOCHRONE_FILL_LAYER)) {
        map.setPaintProperty(ISOCHRONE_FILL_LAYER, 'fill-opacity', 0);
      }
      src.setData(isochrones);
      requestAnimationFrame(() => {
        if (map.getLayer(ISOCHRONE_FILL_LAYER)) {
          map.setPaintProperty(ISOCHRONE_FILL_LAYER, 'fill-opacity', 0.45);
        }
      });
    };

    if (map.isStyleLoaded()) apply();
    else map.once('load', apply);
  }, [isochrones]);

  // Swap the basemap when the theme changes; re-add the isochrone source/layer
  // because setStyle wipes user-added layers. Skip the no-op on initial mount
  // (the map was already created with the right style).
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (lastThemeRef.current === theme) return;
    lastThemeRef.current = theme;

    map.setStyle(STYLE_URL[theme]);
    map.once('style.load', () => {
      if (!map.getSource(ISOCHRONE_SOURCE)) {
        map.addSource(ISOCHRONE_SOURCE, {
          type: 'geojson',
          data: isochrones ?? { type: 'FeatureCollection', features: [] },
        });
      }
      if (!map.getLayer(ISOCHRONE_FILL_LAYER)) {
        const hasData = !!isochrones && isochrones.features.length > 0;
        map.addLayer({
          id: ISOCHRONE_FILL_LAYER,
          type: 'fill',
          source: ISOCHRONE_SOURCE,
          paint: {
            'fill-color': ['get', 'fill'],
            'fill-opacity': hasData ? 0.45 : 0,
            'fill-opacity-transition': { duration: 450, delay: 0 },
            'fill-antialias': true,
          },
        });
      }
    });
  }, [theme]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0"
      style={{ width: '100%', height: '100%', background: CONTAINER_BG[theme] }}
    />
  );
}
