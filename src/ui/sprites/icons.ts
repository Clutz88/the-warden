import { BASE_PALETTE } from "./palette";
import { spriteSvg } from "./pixelArt";

const LAMPPOST = `
.OOOOOO.
OYYYYYYO
OYYYYYYO
OYYYYYYO
.OOOOOO.
...MM...
...MM...
...MM...
...MM...
...MM...
...MM...
...MM...
...MM...
...MM...
...MM...
...MM...
...MM...
.OMMMMO.
.OMMMMO.
OOOOOOOO
`;

const TICKET_MACHINE = `
.OOOOOOOOOO.
OKKKKKKKKKKO
OKWWWWWWWWKO
OKWXXXXXXWKO
OKWXXXXXXWKO
OKWWWWWWWWKO
OKKKKKKKKKKO
OKYYYYYYYYKO
OKYYYYYYYYKO
OKKKKKKKKKKO
OKKKKKKKKKKO
.OOOOOOOOOO.
....OOOO....
....OOOO....
....OOOO....
....OOOO....
....OOOO....
...OOOOOO...
`;

const ZONE_SIGN = `
OOOOOOOOOOO
OYYYYYYYYYO
OYpppppppYO
OYpYYYYYpYO
OYpYpppYpYO
OYpYYYYYpYO
OYpppppppYO
OYYYYYYYYYO
OOOOOOOOOOO
.....M.....
.....M.....
.....M.....
.....M.....
.....M.....
.....M.....
.....M.....
....MMM....
...OMMMO...
`;

const STAMP_TICK = `
.....GG.
....GGG.
...GGG..
GGGGG...
.GGG....
..G.....
`;

const STAMP_X = `
JJ....JJ
.JJ..JJ.
..JJJJ..
...JJ...
..JJJJ..
.JJ..JJ.
JJ....JJ
`;

const ARROW_RIGHT = `
.....OO.
....OOO.
OOOOOOOO
OOOOOOOO
....OOO.
.....OO.
`;

export function lamppost(): string {
  return spriteSvg(LAMPPOST, BASE_PALETTE, { className: "spr lamppost" });
}

export function ticketMachine(): string {
  return spriteSvg(TICKET_MACHINE, BASE_PALETTE, { className: "spr ticket-machine" });
}

export function zoneSign(zone: string): string {
  return `<div class="zone-sign">${spriteSvg(ZONE_SIGN, BASE_PALETTE, { className: "spr zone-sign-svg" })}<span class="zone-sign-label">ZONE&nbsp;${zone}</span></div>`;
}

export function stampTick(): string {
  return spriteSvg(STAMP_TICK, BASE_PALETTE, { className: "spr stamp" });
}

export function stampX(): string {
  return spriteSvg(STAMP_X, BASE_PALETTE, { className: "spr stamp" });
}

export function arrowRight(): string {
  return spriteSvg(ARROW_RIGHT, BASE_PALETTE, { className: "spr arrow" });
}
