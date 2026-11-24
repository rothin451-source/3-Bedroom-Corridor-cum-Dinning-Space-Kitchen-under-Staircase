import * as THREE from 'three';

function makeCanvas(size: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  return [canvas, ctx];
}

function finalizeTexture(
  canvas: HTMLCanvasElement,
  repeatX: number,
  repeatY: number,
  isColor: boolean,
  anisotropy: number,
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.colorSpace = isColor ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.anisotropy = Math.max(1, anisotropy);
  tex.needsUpdate = true;
  return tex;
}

export function createOakFloorTexture(anisotropy: number): {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} {
  const size = 512;
  const [cColor, ctxC] = makeCanvas(size);
  const [cBump, ctxB] = makeCanvas(size);

  ctxC.fillStyle = '#c89b6c';
  ctxC.fillRect(0, 0, size, size);
  ctxB.fillStyle = '#b0b0b0';
  ctxB.fillRect(0, 0, size, size);

  const plankRows = 8;
  const plankH = size / plankRows;

  for (let row = 0; row < plankRows; row++) {
    const y = row * plankH;
    const offset = (row % 3) * 170;
    const cols = 2;
    const plankW = size / cols;

    for (let col = -1; col <= cols; col++) {
      const x = col * plankW + offset;
      const shade = ((row * 7 + col * 13) % 14) - 7;
      const r = Math.min(255, Math.max(0, 198 + shade * 2));
      const g = Math.min(255, Math.max(0, 151 + shade * 1.5));
      const b = Math.min(255, Math.max(0, 102 + shade));
      ctxC.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctxC.fillRect(x, y, plankW - 2, plankH - 2);

      // Subtle wood grain streaks
      ctxC.strokeStyle = 'rgba(115, 74, 38, 0.14)';
      ctxC.lineWidth = 1;
      for (let gLine = 0; gLine < 9; gLine++) {
        const gy = y + 5 + gLine * (plankH / 10);
        ctxC.beginPath();
        ctxC.moveTo(x + 2, gy);
        ctxC.bezierCurveTo(
          x + plankW * 0.33,
          gy + ((gLine % 2 === 0 ? 1 : -1) * 2),
          x + plankW * 0.66,
          gy - ((gLine % 2 === 0 ? 1 : -1) * 2),
          x + plankW - 4,
          gy,
        );
        ctxC.stroke();
      }

      // Plank seams in color & bump
      ctxC.fillStyle = '#8b633c';
      ctxC.fillRect(x, y + plankH - 2, plankW, 2);
      ctxC.fillRect(x + plankW - 2, y, 2, plankH);

      ctxB.fillStyle = '#555555';
      ctxB.fillRect(x, y + plankH - 2, plankW, 2);
      ctxB.fillRect(x + plankW - 2, y, 2, plankH);
    }
  }

  return {
    map: finalizeTexture(cColor, 4, 4, true, anisotropy),
    bumpMap: finalizeTexture(cBump, 4, 4, false, anisotropy),
  };
}

export function createLimestoneTileTexture(anisotropy: number): {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} {
  const size = 512;
  const [cColor, ctxC] = makeCanvas(size);
  const [cBump, ctxB] = makeCanvas(size);

  ctxC.fillStyle = '#e4e2dc';
  ctxC.fillRect(0, 0, size, size);
  ctxB.fillStyle = '#d4d4d4';
  ctxB.fillRect(0, 0, size, size);

  const tiles = 4;
  const tileSize = size / tiles;

  for (let ty = 0; ty < tiles; ty++) {
    for (let tx = 0; tx < tiles; tx++) {
      const x = tx * tileSize;
      const y = ty * tileSize;
      const v = ((tx * 5 + ty * 11) % 9) - 4;
      ctxC.fillStyle = `rgb(${227 + v}, ${224 + v}, ${217 + v})`;
      ctxC.fillRect(x + 2, y + 2, tileSize - 4, tileSize - 4);

      // Subtle mineral speckles
      ctxC.fillStyle = 'rgba(145, 140, 130, 0.14)';
      for (let s = 0; s < 14; s++) {
        const sx = x + ((s * 37 + tx * 19) % (tileSize - 10)) + 5;
        const sy = y + ((s * 53 + ty * 23) % (tileSize - 10)) + 5;
        ctxC.fillRect(sx, sy, 2, 2);
      }

      // Grout lines
      ctxC.fillStyle = '#c5c1b8';
      ctxC.fillRect(x, y, tileSize, 3);
      ctxC.fillRect(x, y, 3, tileSize);

      ctxB.fillStyle = '#707070';
      ctxB.fillRect(x, y, tileSize, 3);
      ctxB.fillRect(x, y, 3, tileSize);
    }
  }

  return {
    map: finalizeTexture(cColor, 7, 2.5, true, anisotropy),
    bumpMap: finalizeTexture(cBump, 7, 2.5, false, anisotropy),
  };
}

export function createKitchenTileTexture(anisotropy: number): THREE.CanvasTexture {
  const size = 512;
  const [canvas, ctx] = makeCanvas(size);
  ctx.fillStyle = '#ddd6ca';
  ctx.fillRect(0, 0, size, size);

  const tiles = 6;
  const step = size / tiles;
  for (let y = 0; y < tiles; y++) {
    for (let x = 0; x < tiles; x++) {
      const shade = ((x + y) % 2 === 0 ? 4 : -4) + ((x * 3 + y * 5) % 5);
      ctx.fillStyle = `rgb(${240 + shade}, ${235 + shade}, ${225 + shade})`;
      ctx.fillRect(x * step + 2, y * step + 2, step - 4, step - 4);
    }
  }
  return finalizeTexture(canvas, 2, 2.5, true, anisotropy);
}

export function createLawnTexture(anisotropy: number): THREE.CanvasTexture {
  const size = 512;
  const [canvas, ctx] = makeCanvas(size);
  ctx.fillStyle = '#bcc8b1';
  ctx.fillRect(0, 0, size, size);

  // Architectural site lawn subtle mottled grid
  for (let i = 0; i < 600; i++) {
    const x = (i * 79) % size;
    const y = (i * 131) % size;
    const r = 3 + (i % 7);
    ctx.fillStyle = i % 2 === 0 ? 'rgba(155, 174, 141, 0.25)' : 'rgba(205, 214, 192, 0.22)';
    ctx.fillRect(x, y, r, r);
  }

  // Subtle architectural site grid lines
  ctx.strokeStyle = 'rgba(110, 125, 105, 0.12)';
  ctx.lineWidth = 1;
  for (let g = 0; g <= size; g += 64) {
    ctx.beginPath();
    ctx.moveTo(g, 0);
    ctx.lineTo(g, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, g);
    ctx.lineTo(size, g);
    ctx.stroke();
  }

  return finalizeTexture(canvas, 18, 18, true, anisotropy);
}

export function createPlasterBumpTexture(anisotropy: number): THREE.CanvasTexture {
  const size = 256;
  const [canvas, ctx] = makeCanvas(size);
  ctx.fillStyle = '#c8c8c8';
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 1200; i++) {
    const x = (i * 47) % size;
    const y = (i * 89) % size;
    const v = 175 + ((i * 17) % 45);
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect(x, y, 2, 2);
  }
  return finalizeTexture(canvas, 4, 2, false, anisotropy);
}

export function createContactShadowTexture(): THREE.CanvasTexture {
  const size = 128;
  const [canvas, ctx] = makeCanvas(size);
  const grad = ctx.createRadialGradient(size / 2, size / 2, 6, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(15, 23, 42, 0.45)');
  grad.addColorStop(0.6, 'rgba(15, 23, 42, 0.18)');
  grad.addColorStop(1, 'rgba(15, 23, 42, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}
