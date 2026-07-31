/* ═══════════ 零依赖打包器：ZIP(store) / ICO / ICNS ═══════════ */
"use strict";

/* CRC32 */
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/* ZIP 构建器（STORE 无压缩，PNG 本身已压缩） */
class ZipBuilder {
  constructor() { this.entries = []; }
  add(name, data) { // data: Uint8Array | string
    if (typeof data === "string") data = new TextEncoder().encode(data);
    this.entries.push({ name, data: new Uint8Array(data) });
  }
  build() {
    const enc = new TextEncoder();
    const chunks = [], central = [];
    let offset = 0;
    const now = new Date();
    const dosTime = ((now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1)) & 0xffff;
    const dosDate = (((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate()) & 0xffff;

    for (const e of this.entries) {
      const nameB = enc.encode(e.name);
      const crc = crc32(e.data);
      const local = new DataView(new ArrayBuffer(30));
      local.setUint32(0, 0x04034b50, true);
      local.setUint16(4, 20, true);       // version
      local.setUint16(6, 0x0800, true);   // UTF-8 flag
      local.setUint16(8, 0, true);        // store
      local.setUint16(10, dosTime, true);
      local.setUint16(12, dosDate, true);
      local.setUint32(14, crc, true);
      local.setUint32(18, e.data.length, true);
      local.setUint32(22, e.data.length, true);
      local.setUint16(26, nameB.length, true);
      local.setUint16(28, 0, true);
      chunks.push(new Uint8Array(local.buffer), nameB, e.data);

      const cd = new DataView(new ArrayBuffer(46));
      cd.setUint32(0, 0x02014b50, true);
      cd.setUint16(4, 20, true); cd.setUint16(6, 20, true);
      cd.setUint16(8, 0x0800, true); cd.setUint16(10, 0, true);
      cd.setUint16(12, dosTime, true); cd.setUint16(14, dosDate, true);
      cd.setUint32(16, crc, true);
      cd.setUint32(20, e.data.length, true);
      cd.setUint32(24, e.data.length, true);
      cd.setUint16(28, nameB.length, true);
      cd.setUint32(42, offset, true);
      central.push(new Uint8Array(cd.buffer), nameB);
      offset += 30 + nameB.length + e.data.length;
    }
    let cdSize = 0;
    central.forEach(c => (cdSize += c.length));
    const eocd = new DataView(new ArrayBuffer(22));
    eocd.setUint32(0, 0x06054b50, true);
    eocd.setUint16(8, this.entries.length, true);
    eocd.setUint16(10, this.entries.length, true);
    eocd.setUint32(12, cdSize, true);
    eocd.setUint32(16, offset, true);
    return new Blob([...chunks, ...central, new Uint8Array(eocd.buffer)], { type: "application/zip" });
  }
}

/* ICO：多尺寸 PNG 容器（Vista+ 支持 PNG 负载） */
function buildIco(pngList) { // [{size, data:Uint8Array}]
  const count = pngList.length;
  const header = new DataView(new ArrayBuffer(6));
  header.setUint16(0, 0, true);
  header.setUint16(2, 1, true); // type: icon
  header.setUint16(4, count, true);
  const dirs = [];
  let offset = 6 + 16 * count;
  for (const p of pngList) {
    const d = new DataView(new ArrayBuffer(16));
    d.setUint8(0, p.size >= 256 ? 0 : p.size);
    d.setUint8(1, p.size >= 256 ? 0 : p.size);
    d.setUint8(2, 0); d.setUint8(3, 0);
    d.setUint16(4, 1, true);  // planes
    d.setUint16(6, 32, true); // bpp
    d.setUint32(8, p.data.length, true);
    d.setUint32(12, offset, true);
    offset += p.data.length;
    dirs.push(new Uint8Array(d.buffer));
  }
  const parts = [new Uint8Array(header.buffer), ...dirs, ...pngList.map(p => p.data)];
  let total = 0; parts.forEach(p => (total += p.length));
  const out = new Uint8Array(total);
  let pos = 0;
  for (const p of parts) { out.set(p, pos); pos += p.length; }
  return out;
}

/* ICNS：PNG 负载块 */
const ICNS_TYPES = { 16: "icp4", 32: "icp5", 64: "icp6", 128: "ic07", 256: "ic08", 512: "ic09", 1024: "ic10" };
function buildIcns(pngList) { // [{size, data}]
  const chunks = [];
  let total = 8;
  for (const p of pngList) {
    const type = ICNS_TYPES[p.size];
    if (!type) continue;
    const head = new Uint8Array(8);
    const tv = new DataView(head.buffer);
    for (let i = 0; i < 4; i++) head[i] = type.charCodeAt(i);
    tv.setUint32(4, 8 + p.data.length, false);
    chunks.push(head, p.data);
    total += 8 + p.data.length;
  }
  const out = new Uint8Array(total);
  out[0] = 0x69; out[1] = 0x63; out[2] = 0x6e; out[3] = 0x73; // 'icns'
  new DataView(out.buffer).setUint32(4, total, false);
  let pos = 8;
  for (const c of chunks) { out.set(c, pos); pos += c.length; }
  return out;
}
