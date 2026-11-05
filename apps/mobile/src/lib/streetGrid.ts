// Same WGS84 transverse Mercator grid as the iOS observation engine.
export function projectStreetPoint(lon: number, lat: number): [number, number] {
  const a = 6378137, f = 1 / 298.257223563, e = f * (2 - f), ep = e / (1 - e);
  const rad = Math.PI / 180;
  const phi = lat * rad, lambda = (lon - 139.8333333333333) * rad;
  function meridian(p: number) {
    return a * ((1-e/4-3*e**2/64-5*e**3/256)*p
      - (3*e/8+3*e**2/32+45*e**3/1024)*Math.sin(2*p)
      + (15*e**2/256+45*e**3/1024)*Math.sin(4*p) - 35*e**3/3072*Math.sin(6*p));
  }
  const n = a / Math.sqrt(1-e*Math.sin(phi)**2), t = Math.tan(phi)**2;
  const c = ep*Math.cos(phi)**2, u = Math.cos(phi)*lambda;
  const x = 0.9999*n*(u+(1-t+c)*u**3/6+(5-18*t+t*t+72*c-58*ep)*u**5/120);
  const y = 0.9999*(meridian(phi)-meridian(36*rad)+n*Math.tan(phi)*
    (u*u/2+(5-t+9*c+4*c*c)*u**4/24+(61-58*t+t*t+600*c-330*ep)*u**6/720));
  const cm = (v: number) => Math.sign(v)*Math.round(Math.abs(v)*100)/100;
  return [cm(x), cm(y)];
}

export function classifyStreetPoint(point: [number, number], rings: number[][][], accuracy: number) {
  if (!Number.isFinite(accuracy) || accuracy < 0 || accuracy > 50 || !rings?.length) return;
  const [x, y] = point;
  let outside = false;
  for (const [index, ring] of rings.entries()) {
    let inside = false;
    if (ring.length < 3) return;
    for (let i = 0; i < ring.length; i++) {
      const [ax, ay] = ring[i], [bx, by] = ring[(i+1) % ring.length];
      if (![ax, ay, bx, by].every(Number.isFinite)) return;
      const dx = bx-ax, dy = by-ay;
      const u = Math.max(0, Math.min(1, ((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy || 1)));
      if (Math.hypot(x-ax-u*dx, y-ay-u*dy) <= accuracy) return;
      if ((ay > y) !== (by > y) && x < ax+(y-ay)*dx/dy) inside = !inside;
    }
    if (inside !== (index === 0)) outside = true;
  }
  if (outside) return "outside";
  return Math.floor(x/100) + ":" + Math.floor(y/100);
}


export function insideCell(point: [number, number], rings: number[][][], accuracy: number) {
  const result = classifyStreetPoint(point, rings, accuracy);
  return result === "outside" ? undefined : result;
}
