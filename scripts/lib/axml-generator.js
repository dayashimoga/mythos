/**
 * Android Binary XML (AXML) Generator for compiled AndroidManifest.xml
 * Implements the Android Asset Packaging Format specification
 */

const RES_XML_TYPE = 0x0003;
const RES_STRING_POOL_TYPE = 0x0001;
const RES_XML_RESOURCE_MAP_TYPE = 0x0180;
const RES_XML_START_NAMESPACE_TYPE = 0x0100;
const RES_XML_END_NAMESPACE_TYPE = 0x0101;
const RES_XML_START_ELEMENT_TYPE = 0x0102;
const RES_XML_END_ELEMENT_TYPE = 0x0103;

export function generateCanonicalBinaryXml() {
  const strings = [
    'http://schemas.android.com/apk/res/android',
    'android',
    'manifest',
    'package',
    'com.mythos.astra',
    'versionCode',
    'versionName',
    '0.1.0',
    'application',
    'label',
    'Mythos Astra',
    'hardwareAccelerated',
    'activity',
    'name',
    'com.mythos.astra.MainActivity',
    'screenOrientation',
    'sensorLandscape',
    'exported',
  ];

  // String pool construction (UTF-16LE with 2-byte length prefix + null terminator)
  const stringOffsets = [];
  const stringBuffers = [];
  let currentStringOffset = 0;

  for (const s of strings) {
    stringOffsets.push(currentStringOffset);
    const len = s.length;
    const lenBuf = Buffer.alloc(2);
    lenBuf.writeUInt16LE(len, 0);
    const strBuf = Buffer.from(s, 'utf16le');
    const term = Buffer.alloc(2); // 0x0000
    const entry = Buffer.concat([lenBuf, strBuf, term]);
    stringBuffers.push(entry);
    currentStringOffset += entry.length;
  }

  const allStringsData = Buffer.concat(stringBuffers);

  // String pool header: 28 bytes
  // type(2), headerSize(2), chunkSize(4), stringsCount(4), stylesCount(4), flags(4), stringsStart(4), stylesStart(4)
  const stringPoolHeaderSize = 28;
  const offsetsTableSize = strings.length * 4;
  const stringsStart = stringPoolHeaderSize + offsetsTableSize;
  const stringPoolPadding = (4 - ((stringsStart + allStringsData.length) % 4)) % 4;
  const stringPoolChunkSize = stringsStart + allStringsData.length + stringPoolPadding;

  const stringPoolBuf = Buffer.alloc(stringPoolChunkSize);
  stringPoolBuf.writeUInt16LE(RES_STRING_POOL_TYPE, 0);
  stringPoolBuf.writeUInt16LE(stringPoolHeaderSize, 2);
  stringPoolBuf.writeUInt32LE(stringPoolChunkSize, 4);
  stringPoolBuf.writeUInt32LE(strings.length, 8);
  stringPoolBuf.writeUInt32LE(0, 12); // stylesCount
  stringPoolBuf.writeUInt32LE(0, 16); // flags (UTF-16)
  stringPoolBuf.writeUInt32LE(stringsStart, 20);
  stringPoolBuf.writeUInt32LE(0, 24); // stylesStart

  for (let i = 0; i < strings.length; i++) {
    stringPoolBuf.writeUInt32LE(stringOffsets[i], stringPoolHeaderSize + i * 4);
  }
  allStringsData.copy(stringPoolBuf, stringsStart);

  // Resource map chunk (attr resource IDs: versionCode=0x0101021b, versionName=0x0101021c, etc.)
  const resIds = [0x0101021b, 0x0101021c, 0x01010001, 0x010102d3, 0x01010003, 0x0101001e, 0x01010010];
  const resMapHeaderSize = 8;
  const resMapChunkSize = resMapHeaderSize + resIds.length * 4;
  const resMapBuf = Buffer.alloc(resMapChunkSize);
  resMapBuf.writeUInt16LE(RES_XML_RESOURCE_MAP_TYPE, 0);
  resMapBuf.writeUInt16LE(resMapHeaderSize, 2);
  resMapBuf.writeUInt32LE(resMapChunkSize, 4);
  for (let i = 0; i < resIds.length; i++) {
    resMapBuf.writeUInt32LE(resIds[i], resMapHeaderSize + i * 4);
  }

  // XML Start Namespace: type(2)=0x0100, headerSize(2)=16, chunkSize(4)=24, line(4)=1, comment(4)=0xffffffff, prefix(4)=1, uri(4)=0
  const startNsBuf = Buffer.alloc(24);
  startNsBuf.writeUInt16LE(RES_XML_START_NAMESPACE_TYPE, 0);
  startNsBuf.writeUInt16LE(16, 2);
  startNsBuf.writeUInt32LE(24, 4);
  startNsBuf.writeUInt32LE(1, 8); // line
  startNsBuf.writeInt32LE(-1, 12); // comment
  startNsBuf.writeUInt32LE(1, 16); // prefix ('android')
  startNsBuf.writeUInt32LE(0, 20); // uri ('http://schemas.android.com/apk/res/android')

  // XML Start Element: 'manifest'
  // header: type(2)=0x0102, headerSize(2)=16, chunkSize(4), line(4)=1, comment(4)=-1, ns(4)=-1, name(4)=2 ('manifest'), attrStart(2)=20, attrSize(2)=20, attrCount(2)=0, idIndex(2)=0, classIndex(2)=0, styleIndex(2)=0
  const startManifestBuf = Buffer.alloc(36);
  startManifestBuf.writeUInt16LE(RES_XML_START_ELEMENT_TYPE, 0);
  startManifestBuf.writeUInt16LE(16, 2);
  startManifestBuf.writeUInt32LE(36, 4);
  startManifestBuf.writeUInt32LE(1, 8);
  startManifestBuf.writeInt32LE(-1, 12);
  startManifestBuf.writeInt32LE(-1, 16); // ns
  startManifestBuf.writeUInt32LE(2, 20); // name 'manifest'
  startManifestBuf.writeUInt16LE(20, 24); // attrStart
  startManifestBuf.writeUInt16LE(20, 26); // attrSize
  startManifestBuf.writeUInt16LE(0, 28); // attrCount
  startManifestBuf.writeUInt16LE(0, 30);
  startManifestBuf.writeUInt16LE(0, 32);
  startManifestBuf.writeUInt16LE(0, 34);

  // XML End Element: 'manifest'
  const endManifestBuf = Buffer.alloc(24);
  endManifestBuf.writeUInt16LE(RES_XML_END_ELEMENT_TYPE, 0);
  endManifestBuf.writeUInt16LE(16, 2);
  endManifestBuf.writeUInt32LE(24, 4);
  endManifestBuf.writeUInt32LE(1, 8);
  endManifestBuf.writeInt32LE(-1, 12);
  endManifestBuf.writeInt32LE(-1, 16); // ns
  endManifestBuf.writeUInt32LE(2, 20); // name 'manifest'

  // XML End Namespace
  const endNsBuf = Buffer.alloc(24);
  endNsBuf.writeUInt16LE(RES_XML_END_NAMESPACE_TYPE, 0);
  endNsBuf.writeUInt16LE(16, 2);
  endNsBuf.writeUInt32LE(24, 4);
  endNsBuf.writeUInt32LE(1, 8);
  endNsBuf.writeInt32LE(-1, 12);
  endNsBuf.writeUInt32LE(1, 16); // prefix
  endNsBuf.writeUInt32LE(0, 20); // uri

  // Total file: Root header (8 bytes) + stringPool + resMap + startNs + startManifest + endManifest + endNs
  const rootHeaderSize = 8;
  const totalFileSize = rootHeaderSize + stringPoolBuf.length + resMapBuf.length + startNsBuf.length + startManifestBuf.length + endManifestBuf.length + endNsBuf.length;

  const totalBuf = Buffer.alloc(totalFileSize);
  totalBuf.writeUInt16LE(RES_XML_TYPE, 0);
  totalBuf.writeUInt16LE(rootHeaderSize, 2);
  totalBuf.writeUInt32LE(totalFileSize, 4);

  let curOffset = rootHeaderSize;
  stringPoolBuf.copy(totalBuf, curOffset);
  curOffset += stringPoolBuf.length;
  resMapBuf.copy(totalBuf, curOffset);
  curOffset += resMapBuf.length;
  startNsBuf.copy(totalBuf, curOffset);
  curOffset += startNsBuf.length;
  startManifestBuf.copy(totalBuf, curOffset);
  curOffset += startManifestBuf.length;
  endManifestBuf.copy(totalBuf, curOffset);
  curOffset += endManifestBuf.length;
  endNsBuf.copy(totalBuf, curOffset);

  return totalBuf;
}
