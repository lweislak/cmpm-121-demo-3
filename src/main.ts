import "./style.css";

const APP_NAME = "D3: Geocoin Carrier";
//const app = document.querySelector<HTMLDivElement>("#app")!;
document.title = APP_NAME;

// @deno-types="npm:@types/leaflet@^1.9.14"
import leaflet from "leaflet";

import "leaflet/dist/leaflet.css";
import "./style.css";
import "./leafletWorkaround.ts";
import luck from "./luck.ts";

import { Board } from "./board.ts";

const OAKES_CLASSROOM = leaflet.latLng(36.98949379578401, -122.06277128548504);
const GAMEPLAY_ZOOM_LEVEL = 19;
const TILE_DEGREES = 1e-4;
const NEIGHBORHOOD_SIZE = 8;
const CACHE_SPAWN_PROBABILITY = 0.1;
const board = new Board(TILE_DEGREES, NEIGHBORHOOD_SIZE);

const map = leaflet.map(document.getElementById("map")!, {
  center: OAKES_CLASSROOM,
  zoom: GAMEPLAY_ZOOM_LEVEL,
  minZoom: GAMEPLAY_ZOOM_LEVEL,
  maxZoom: GAMEPLAY_ZOOM_LEVEL,
  zoomControl: false,
  scrollWheelZoom: false,
});

// Populate the map with a background tile layer
leaflet
  .tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  })
  .addTo(map);

// Add a marker to represent the player
const playerMarker = leaflet.marker(OAKES_CLASSROOM);
playerMarker.bindTooltip("You are here");
playerMarker.addTo(map);

// Display the player's points
let playerPoints = 0;
const statusPanel = document.querySelector<HTMLDivElement>("#statusPanel")!;
statusPanel.innerHTML = `Points: ${playerPoints}`;

// Add caches to the map by cell numbers
function spawnCache(i: number, j: number) {
  const bounds = board.getCellBounds({ i, j });

  // Add a rectangle to the map to represent the cache
  const rect = leaflet.rectangle(bounds);
  rect.addTo(map);

  // Handle interactions with the cache
  rect.bindPopup(() => {
    let pointValue = Math.floor(luck([i, j, "initialValue"].toString()) * 5);

    const popupDiv = document.createElement("div");
    popupDiv.innerHTML = `
                <div>Location: ("${i},${j}"). Points avaliable: <span id="value">${pointValue}</span></div>
                <button id="collect">Collect</button>
                <button id="deposit">Deposit</button>`;

    // Clicking the button decrements the cache's value and increments the player's points
    popupDiv.querySelector<HTMLButtonElement>("#collect")!.addEventListener(
      "click",
      () => {
        if (pointValue > 0) {
          pointValue--;
          popupDiv.querySelector<HTMLSpanElement>("#value")!.innerHTML =
            pointValue.toString();
          playerPoints++;
          statusPanel.innerHTML = `Points: ${playerPoints}`;
        }
      },
    );

    // Clicking the button increments the cache's value and decrements the player's points
    popupDiv.querySelector<HTMLButtonElement>("#deposit")!.addEventListener(
      "click",
      () => {
        if (playerPoints > 0) {
          playerPoints--;
          pointValue++;
          popupDiv.querySelector<HTMLSpanElement>("#value")!.innerHTML =
            pointValue.toString();
          statusPanel.innerHTML = `Points: ${playerPoints}`;
        }
      },
    );
    return popupDiv;
  });
}

board.getCellsNearPoint(OAKES_CLASSROOM).forEach((cell) => {
  if (luck([cell.i, cell.j].toString()) < CACHE_SPAWN_PROBABILITY) {
    spawnCache(cell.i, cell.j);
  }
});
