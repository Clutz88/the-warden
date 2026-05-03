import type { Car } from "../../game/types";
import { COLOUR_HEX, carPalette } from "./palette";
import { spriteSvg } from "./pixelArt";

const FIESTA = `
............OOOOOOOOO............
...........OWWWWWWWWWO...........
..OOOOOOOOOOWWWWWWWWWWOOOOOOOOO..
.OBBBBBBBBBOWWWWWWWWWWOBBBBBBBBO.
OLBBBBBBBBBBBBBBBBBBBBBBBBBBBBRO
OLBBBBBBBBBBBBBPPPPBBBBBBBBBBBRO
OBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBO
OMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMO
.OO........OOO........OOO......O
....TTTT.............TTTT.......
...THHHHT...........THHHHT......
...THHHHT...........THHHHT......
....TTTT.............TTTT.......
.................................
`;

const GOLF = `
.........OOOOOOOOOOOOO...........
........OWWWWWWWWWWWWWO..........
.OOOOOOOOWWWWWWWWWWWWWWOOOOOOOO..
OBBBBBBBOWWWWWWWWWWWWWWOBBBBBBBO.
OLBBBBBBBBBBBBBBBBBBBBBBBBBBBBRO
OLBBBBBBBBBBBPPPPPPBBBBBBBBBBBRO
OBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBO
OMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMO
.OO.......OOO..........OOO.....O
....TTTT...................TTTT..
...THHHHT.................THHHHT.
...THHHHT.................THHHHT.
....TTTT...................TTTT..
.................................
`;

const MINI = `
............................
.......OSSSSSSSSSSSO........
......OSSWWWWWWWWWSSSO......
.OOOOOSSWWWWWWWWWWWWSSOOO...
OBBBBSSWWWWWWWWWWWWWWSSBBBO.
OLBBBBBBBBBBBBBBBBBBBBBBBRO.
OLBBBBBBBBPPPPPPBBBBBBBBBRO.
OBBBBBBBBBBBBBBBBBBBBBBBBBO.
OMMMMMMMMMMMMMMMMMMMMMMMMMO.
.OO......OOO.......OOO....O.
...TTTT...............TTTT..
..THHHHT.............THHHHT.
..THHHHT.............THHHHT.
...TTTT...............TTTT..
............................
`;

const CORSA = `
.................OOOOOOOO........
................OWWWWWWWWO.......
..OOOOOOOOOOOOOOOWWWWWWWWWO......
.OBBBBBBBBBBBBBBBWWWWWWWWWWO.....
.OBBBBBBBBBBBBBBBBBBBBBBBBBBO....
OLBBBBBBBBBBBBBBBBBBBBBBBBBBRO...
OLBBBBBBBBBBPPPPPPBBBBBBBBBBRO...
OMMMMMMMMMMMMMMMMMMMMMMMMMMMMO...
.OO......OOO.........OOO......O..
....TTTT.................TTTT....
...THHHHT...............THHHHT...
...THHHHT...............THHHHT...
....TTTT.................TTTT....
.................................
`;

const QASHQAI = `
............OOOOOOOOOOO..........
...........OWWWWWWWWWWWO.........
..........OWWWWWWWWWWWWWO........
.OOOOOOOOOOWWWWWWWWWWWWWWOOOOOOO.
.OBBBBBBBBBWWWWWWWWWWWWWWBBBBBBO.
OLBBBBBBBBBBBBBBBBBBBBBBBBBBBBRO
OLBBBBBBBBBBBBPPPPPPBBBBBBBBBBRO
OBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBO
OMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMO
.OO........OOO.........OOO.....O
....TTTT..................TTTT..
...THHHHT................THHHHT.
...THHHHT................THHHHT.
....TTTT..................TTTT..
................................
`;

const BMW = `
............OOOOOOOOOO..........
...........OWWWWWWWWWWO.........
.OOOOOOOOOOOWWWWWWWWWWWOOOOOOOOOO
OBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBO
OBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBO
OLBBBBBBBBBBBBBBBBBBBBBBBBBBBBBRO
OLBBBBBBBBBBBBBPPPPBBBBBBBBBBBBRO
OBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBO
OMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMO
.OO........OOO..........OOO.....O
.....TTTT..................TTTT..
....THHHHT................THHHHT.
....THHHHT................THHHHT.
.....TTTT..................TTTT..
.................................
`;

const YARIS = `
.................OOOOOOOO....
................OWWWWWWWWO...
...............OWWWWWWWWWWO..
.OOOOOOOOOOOOOOOWWWWWWWWWWWO.
.OBBBBBBBBBBBBBBWWWWWWWWWWWWO
OLBBBBBBBBBBBBBBBBBBBBBBBBBRO
OLBBBBBBBBBBPPPPPPBBBBBBBBBRO
OBBBBBBBBBBBBBBBBBBBBBBBBBBBO
OMMMMMMMMMMMMMMMMMMMMMMMMMMMO
.OO......OOO.........OOO....O
....TTTT................TTTT..
...THHHHT..............THHHHT.
...THHHHT..............THHHHT.
....TTTT................TTTT..
..............................
`;

const DISCOVERY = `
.OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO
.OrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrO
.OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO
.OWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWO
.OWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWO
OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO
OBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBO
OLBBBBBBBBBBBBBBBBBBBBBBBBBBBBBRO
OLBBBBBBBBBBBPPPPPPPBBBBBBBBBBBRO
OBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBO
OMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMO
.OO.......OOO..........OOO......O
....TTTT...................TTTT..
...THHHHT.................THHHHT.
...THHHHT.................THHHHT.
....TTTT...................TTTT..
.................................
`;

const I10 = `
............OOOOOOO........
...........OWWWWWWWO.......
..........OWWWWWWWWWO......
.OOOOOOOOOOWWWWWWWWWWOOOOO.
.OBBBBBBBBBWWWWWWWWWWBBBBO.
OLBBBBBBBBBBBBBBBBBBBBBBRO.
OLBBBBBBBPPPPPPBBBBBBBBBRO.
OBBBBBBBBBBBBBBBBBBBBBBBBO.
OMMMMMMMMMMMMMMMMMMMMMMMMO.
.OO.....OOO........OOO...O.
...TTTT..............TTTT..
..THHHHT............THHHHT.
..THHHHT............THHHHT.
...TTTT..............TTTT..
...........................
`;

const P208 = `
...........OOOOOOOOO............
..........OWWWWWWWWWO...........
.OOOOOOOOOOWWWWWWWWWWOOOOOOOOO..
OBBBBBBBBBOWWWWWWWWWWOBBBBBBBBO.
OLGGGGBBBBBBBBBBBBBBBBBBBBBBBRO.
OLGGGGBBBBBBPPPPPPBBBBBBBBBBBRO.
OBBBBBBBBBBBBBBBBBBBBBBBBBBBBBO.
OMMMMMMMMMMMMMMMMMMMMMMMMMMMMMO.
.OO........OOO.........OOO....O.
....TTTT..................TTTT..
...THHHHT................THHHHT.
...THHHHT................THHHHT.
....TTTT..................TTTT..
................................
`;

const GENERIC = FIESTA;

const GRIDS: Record<string, string> = {
  "Ford Fiesta": FIESTA,
  "VW Golf": GOLF,
  "Mini Cooper": MINI,
  "Vauxhall Corsa": CORSA,
  "Nissan Qashqai": QASHQAI,
  "BMW 3 Series": BMW,
  "Toyota Yaris": YARIS,
  "Land Rover Discovery": DISCOVERY,
  "Hyundai i10": I10,
  "Peugeot 208": P208,
};

export function renderCarSprite(car: Car): string {
  const grid = GRIDS[car.model] ?? GENERIC;
  const bodyHex = COLOUR_HEX[car.colour] ?? "#888";
  const palette = carPalette(bodyHex);
  return spriteSvg(grid, palette, { className: "car-svg" });
}

export function renderPlate(plate: string): string {
  return `<span class="plate-text">${plate}</span>`;
}
