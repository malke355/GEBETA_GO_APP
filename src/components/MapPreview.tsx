import { WebView } from 'react-native-webview';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components';
import { colors, spacing } from '@/theme';

export type MapMarker = {
  lat: number;
  lng: number;
  label: string;
};

type MapPreviewProps = {
  markers: MapMarker[];
  height?: number;
};

function isValid(marker: MapMarker): boolean {
  return Number.isFinite(marker.lat) && Number.isFinite(marker.lng);
}

export function MapPreview({ markers, height = 220 }: MapPreviewProps) {
  const valid = markers.filter(isValid);
  const origin = valid[0];

  if (!origin) {
    return (
      <View style={[styles.fallback, { height }]}>
        <AppText muted>Map unavailable until coordinates are ready.</AppText>
      </View>
    );
  }

  const payload = JSON.stringify(valid);
  const html = `<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>html,body,#map{margin:0;height:100%;}</style>
  </head>
  <body>
    <div id="map"></div>
    <script>
      const markers = ${payload};
      const map = L.map('map').setView([markers[0].lat, markers[0].lng], 14);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);
      const bounds = [];
      markers.forEach((marker) => {
        L.marker([marker.lat, marker.lng]).addTo(map).bindPopup(marker.label);
        bounds.push([marker.lat, marker.lng]);
      });
      if (bounds.length > 1) {
        map.fitBounds(bounds, { padding: [28, 28] });
      }
    </script>
  </body>
</html>`;

  return (
    <View style={[styles.wrap, { height }]}>
      <WebView
        originWhitelist={['*']}
        source={{ html }}
        style={styles.web}
        scrollEnabled={false}
        javaScriptEnabled
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  web: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  fallback: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
});
