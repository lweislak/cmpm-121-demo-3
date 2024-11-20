import leaflet from "leaflet";

interface Cell {
  readonly i: number;
  readonly j: number;
}

export class Board {
  readonly tileWidth: number;
  readonly tileVisibilityRadius: number;

  private readonly knownCells: Map<string, Cell>;

  constructor(tileWidth: number, tileVisibilityRadius: number) {
    this.tileWidth = tileWidth;
    this.tileVisibilityRadius = tileVisibilityRadius;
    this.knownCells = new Map();
  }

  //Return the location of the cell at the index
  private getCanonicalCell(cell: Cell): Cell {
    const { i, j } = cell;
    const key = [i, j].toString();
    if (!this.knownCells.has(key)) {
      this.knownCells.set(key, { i, j });
    }
    return this.knownCells.get(key)!;
  }

  //Return the index of the cell that the point is located in
  getCellForPoint(point: leaflet.LatLng): Cell {
    return this.getCanonicalCell({
      i: Math.floor(point.lat / this.tileWidth),
      j: Math.floor(point.lng / this.tileWidth),
    });
  }

  //Returns bounds of cell
  getCellBounds(cell: Cell): leaflet.LatLngBounds {
    const topLeft = {
      lat: cell.i * this.tileWidth,
      lng: cell.j * this.tileWidth,
    };
    const bottomRight = {
      lat: (cell.i + 1) * this.tileWidth,
      lng: (cell.j + 1) * this.tileWidth,
    };
    return [topLeft, bottomRight];
  }

  //Return cells located within radius of the given point
  getCellsNearPoint(point: leaflet.LatLng): Cell[] {
    const resultCells: Cell[] = [];
    const originCell = this.getCellForPoint(point);
    for (
      let i = -this.tileVisibilityRadius;
      i <= this.tileVisibilityRadius;
      i++
    ) {
      for (
        let j = -this.tileVisibilityRadius;
        j <= this.tileVisibilityRadius;
        j++
      ) {
        resultCells.push(
          this.getCanonicalCell({ i: originCell.i + i, j: originCell.j + j }),
        );
      }
    }
    return resultCells;
  }
}
