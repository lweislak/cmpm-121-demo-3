import "./style.css";

const APP_NAME = "D3: Geocoin Carrier";
//const app = document.querySelector<HTMLDivElement>("#app")!;
document.title = APP_NAME;

// @deno-types="npm:@types/leaflet@^1.9.14"
// deno-lint-ignore no-unused-vars
import leaflet, { LatLngBounds } from "leaflet";

import "leaflet/dist/leaflet.css";
import "./style.css";
import "./leafletWorkaround.ts";
import luck from "./luck.ts";

import { Board } from "./board.ts";
import { Cell } from "./board.ts";

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

//Add layer to store caches
const cacheLayer = leaflet.layerGroup().addTo(map);

// Display the player's coins
const statusPanel = document.querySelector<HTMLDivElement>("#statusPanel")!;
statusPanel.innerHTML = "No coins yet";

interface Coin {
  readonly i: number;
  readonly j: number;
  readonly serial: number;
}

interface Inventory {
  playerCoins: Coin[];
}

interface Memento {
  toMemento(): string;
  fromMemento(memento: string): void;
}

interface Cache extends Memento {
  coins: Coin[];
}

function createCache(_cell: Cell, coins: Coin[]): Cache {
  return {
    coins,
    toMemento() {
      return JSON.stringify(this.coins);
    },
    fromMemento(memento: string) {
      this.coins = JSON.parse(memento);
    },
  };
}

const playerInventory: Inventory = { playerCoins: [] };
const mementos: Map<Cell, string> = new Map();

// Add caches to the map by cell numbers
function spawnCache(i: number, j: number) {
  const bounds = board.getCellBounds({ i, j });
  const numCoins = Math.floor(luck([i, j, "initialValue"].toString()) * 5);

  let cache: Cache;
  const cell: Cell = { i: i, j: j };

  if (mementos.has(cell)) {
    cache = createCache(cell, []);
    cache.fromMemento(mementos.get(cell)!);
  } else {
    const coins = getCoins(i, j, numCoins);
    cache = createCache(cell, coins);
    mementos.set(cell, cache.toMemento());
  }

  //Rectangle represents the cache
  const rect = leaflet.rectangle(bounds);
  cacheLayer.addLayer(rect);
  //rect.addTo(map);

  // Handle interactions with the cache
  rect.bindPopup(() => {
    const popupDiv = document.createElement("div");
    popupDiv.innerHTML = `
                <div>Location: (${i} : ${j}), Number of coins: <span id="value">${cache.coins.length}</span></div>
                <button id="collect">Collect</button>
                <button id="deposit">Deposit</button>`;

    // Clicking the button decrements the cache's value and increments the player's coins
    popupDiv.querySelector<HTMLButtonElement>("#collect")!.addEventListener(
      "click",
      () => {
        if (cache.coins.length > 0) {
          playerInventory.playerCoins.push(cache.coins.pop()!);
          updateStatusPanel();
          updatePopup(cache.coins);
        }
      },
    );

    // Clicking the button increments the cache's value and decrements the player's coins
    popupDiv.querySelector<HTMLButtonElement>("#deposit")!.addEventListener(
      "click",
      () => {
        if (playerInventory.playerCoins.length > 0) {
          cache.coins.push(playerInventory.playerCoins.pop()!);
          updateStatusPanel();
          updatePopup(cache.coins);
        }
      },
    );
    return popupDiv;
  });
}

//Return array of avaliable coins in cache
function getCoins(ci: number, cj: number, numCoins: number): Coin[] {
  const coins: Coin[] = [];
  Array.from({ length: numCoins }, (_, i) => {
    const coin: Coin = {
      i: ci,
      j: cj,
      serial: i,
    };
    coins.push(coin);
  });
  return coins;
}

//This is so janky
//Update display of coins in player's inventory
function updateStatusPanel() {
  let currInventory = "";
  if (playerInventory.playerCoins.length <= 0) currInventory = "No coins yet";
  playerInventory.playerCoins.forEach((coin) => {
    currInventory += `(${coin.i}, ${coin.j} #${coin.serial}) `;
  });
  statusPanel.innerHTML = currInventory;
}

//Update cache popup when coins are deposited/withdrawn
function updatePopup(coins: Coin[]) {
  document.querySelector<HTMLSpanElement>("#value")!.innerHTML = coins.length
    .toString();
}

//Clear caches and update based on player's new location
function updateCaches(currLocation: Cell) {
  cacheLayer.clearLayers();

  const cellsInRange = board.getCellsNearPoint(currLocation);
  cellsInRange.forEach((cell) => {
    if (luck([cell.i, cell.j].toString()) < CACHE_SPAWN_PROBABILITY) {
      spawnCache(cell.i, cell.j);
    }
  });
}

//Update player's location on the map
function updatePlayerLocation(currLocation: Cell) {
  const updateLocation = leaflet.latLng(
    currLocation.i * TILE_DEGREES,
    currLocation.j * TILE_DEGREES,
  );
  playerMarker.setLatLng(updateLocation);
  map.setView(updateLocation, GAMEPLAY_ZOOM_LEVEL);

  updateCaches(updateLocation);
}

function setupControlPanelButtons() {
  const controlPanelButtons =
    document.querySelector<HTMLDivElement>("#controlPanel")!.children;
  let currLocation = board.getCellForPoint(OAKES_CLASSROOM);

  controlPanelButtons[0].addEventListener("click", () => {
    currLocation = { i: currLocation.i + 1, j: currLocation.j };
    updatePlayerLocation(currLocation);
  });
  controlPanelButtons[1].addEventListener("click", () => {
    currLocation = { i: currLocation.i - 1, j: currLocation.j };
    updatePlayerLocation(currLocation);
  });
  controlPanelButtons[2].addEventListener("click", () => {
    currLocation = { i: currLocation.i, j: currLocation.j - 1 };
    updatePlayerLocation(currLocation);
  });
  controlPanelButtons[3].addEventListener("click", () => {
    currLocation = { i: currLocation.i, j: currLocation.j + 1 };
    updatePlayerLocation(currLocation);
  });
}

setupControlPanelButtons();
