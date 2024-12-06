// @deno-types="npm:@types/leaflet@^1.9.14"
// deno-lint-ignore no-unused-vars
import leaflet, { LatLngBounds } from "leaflet";
import "leaflet/dist/leaflet.css";
import "./leafletWorkaround.ts";

import { Cell } from "./board.ts";

const OAKES_CLASSROOM = leaflet.latLng(36.98949379578401, -122.06277128548504);
const GAMEPLAY_ZOOM_LEVEL = 19;
const TILE_DEGREES = 1e-4;

export class MapService {
  public map: leaflet.Map;
  public cacheLayer = leaflet.layerGroup();
  public locationHistoryLayer = leaflet.layerGroup();
  public center = leaflet.latLng(36.98949379578401, -122.06277128548504);

  constructor() {
    this.map = leaflet.map("map", {
      center: OAKES_CLASSROOM,
      zoom: GAMEPLAY_ZOOM_LEVEL,
      minZoom: GAMEPLAY_ZOOM_LEVEL,
      maxZoom: GAMEPLAY_ZOOM_LEVEL,
      zoomControl: false,
      scrollWheelZoom: false,
    });

    // Populate the map with a background tile layer
    leaflet.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(this.map);

    //Add layer to store caches and player location history
    this.cacheLayer.addTo(this.map);
    this.locationHistoryLayer.addTo(this.map);
  }

  // Add a marker to represent the player
  addMarker(): leaflet.Marker {
    const playerMarker = leaflet.marker(this.map.center);
    //playerMarker.bindTooltip("You are here").addTo(mapService.map);
    return playerMarker;
  }

  addLocationHistory(): leaflet.latLng[] {
    return [];
  }

  updateLocation(cell: Cell): leaflet.latLng {
    return leaflet.latLng(
      cell.i * TILE_DEGREES,
      cell.j * TILE_DEGREES,
    );
  }

  updatePlayerHistory(history: leaflet.latLng[]): leaflet.latLng {
    history.push(location);
    leaflet.polyline(history, { color: "red" }).addTo(
      this.locationHistoryLayer,
    );
    return history;
  }

  updateMarker(playerMarker: leaflet.Marker): leaflet.Marker {
    playerMarker.setLatLng(location);
    this.map.setView(location, GAMEPLAY_ZOOM_LEVEL);
    return playerMarker;
  }

  clearCacheLayer(): void {
    this.cacheLayer.clearLayers();
  }

  clearLocationHistoryLayer(): void {
    this.locationHistoryLayer.clearLayers();
  }

  addRectangle(bounds: leaflet.LatLngBounds): leaflet.Rectangle {
    const rect = leaflet.rectangle(bounds);
    this.cacheLayer.addLayer(rect);
    return rect;
  }
}
