import crypto from 'crypto';

// Adler-32 checksum calculation
function adler32(buf, offset = 0, length = buf.length - offset) {
  let a = 1;
  let b = 0;
  const MOD = 65521;
  for (let i = offset; i < offset + length; i++) {
    a = (a + buf[i]) % MOD;
    b = (b + a) % MOD;
  }
  return ((b << 16) | a) >>> 0;
}

// Write ULEB128
function writeUleb128(val) {
  const bytes = [];
  let v = val;
  do {
    let b = v & 0x7f;
    v >>>= 7;
    if (v !== 0) {
      b |= 0x80;
    }
    bytes.push(b);
  } while (v !== 0);
  return Buffer.from(bytes);
}

/**
 * Generates a valid Dalvik Executable (classes.dex)
 * Containing class definition for com.mythos.astra.MainActivity
 */
export function generateCanonicalDex() {
  const strings = [
    '<init>',
    'Landroid/app/Activity;',
    'Lcom/mythos/astra/MainActivity;',
    'MainActivity.kt',
    'V',
    'VL',
  ].sort();

  // String data items
  const stringDataOffsets = [];
  const stringDataBuffers = [];
  let currentStringDataOffset = 0;

  for (const str of strings) {
    const strUtf8 = Buffer.from(str, 'utf8');
    const uleb = writeUleb128(strUtf8.length);
    const item = Buffer.concat([uleb, strUtf8, Buffer.from([0])]);
    stringDataOffsets.push(currentStringDataOffset);
    stringDataBuffers.push(item);
    currentStringDataOffset += item.length;
  }

  // Types: sorted list of string indices
  const types = [
    strings.indexOf('Landroid/app/Activity;'),
    strings.indexOf('Lcom/mythos/astra/MainActivity;'),
    strings.indexOf('V'),
  ];

  // Protos: shortyIdx, returnTypeIdx, parametersOff
  const protos = [
    { shortyIdx: strings.indexOf('V'), returnTypeIdx: types.indexOf(strings.indexOf('V')), parametersOff: 0 },
  ];

  // Methods: classIdx, protoIdx, nameIdx
  const methods = [
    {
      classIdx: types.indexOf(strings.indexOf('Lcom/mythos/astra/MainActivity;')),
      protoIdx: 0,
      nameIdx: strings.indexOf('<init>'),
    },
  ];

  // Class defs: classIdx, accessFlags, superclassIdx, interfacesOff, sourceFileIdx, annotationsOff, classDataOff, staticValuesOff
  const classDefs = [
    {
      classIdx: types.indexOf(strings.indexOf('Lcom/mythos/astra/MainActivity;')),
      accessFlags: 0x0001, // public
      superclassIdx: types.indexOf(strings.indexOf('Landroid/app/Activity;')),
      interfacesOff: 0,
      sourceFileIdx: strings.indexOf('MainActivity.kt'),
      annotationsOff: 0,
      classDataOff: 0, // will set
      staticValuesOff: 0,
    },
  ];

  // Map header offsets
  const headerSize = 0x70; // 112 bytes
  let curOff = headerSize;

  const stringIdsOff = curOff;
  const stringIdsSize = strings.length;
  curOff += stringIdsSize * 4;

  const typeIdsOff = curOff;
  const typeIdsSize = types.length;
  curOff += typeIdsSize * 4;

  const protoIdsOff = curOff;
  const protoIdsSize = protos.length;
  curOff += protoIdsSize * 12;

  const fieldIdsOff = curOff;
  const fieldIdsSize = 0;

  const methodIdsOff = curOff;
  const methodIdsSize = methods.length;
  curOff += methodIdsSize * 8;

  const classDefsOff = curOff;
  const classDefsSize = classDefs.length;
  curOff += classDefsSize * 32;

  // Data section starts here
  const dataOff = curOff;

  // Class data items (uleb for counts: staticFields=0, instanceFields=0, directMethods=1, virtualMethods=0)
  // method: methodIdxDelta=0, accessFlags=0x10001 (public constructor), codeOff=0
  const classDataBytes = Buffer.concat([
    writeUleb128(0), // staticFieldsSize
    writeUleb128(0), // instanceFieldsSize
    writeUleb128(1), // directMethodsSize
    writeUleb128(0), // virtualMethodsSize
    writeUleb128(0), // methodIdxDelta (method 0)
    writeUleb128(0x10001), // access_flags (public | constructor)
    writeUleb128(0), // codeOff
  ]);

  const actualClassDataOff = curOff;
  classDefs[0].classDataOff = actualClassDataOff;
  curOff += classDataBytes.length;

  // Align to 4 bytes
  const classDataPad = (4 - (curOff % 4)) % 4;
  curOff += classDataPad;

  // String data section
  const actualStringDataOff = curOff;
  const actualStringIdsOffsets = stringDataOffsets.map((o) => actualStringDataOff + o);
  const totalStringData = Buffer.concat(stringDataBuffers);
  curOff += totalStringData.length;

  // Align to 4 bytes
  const stringDataPad = (4 - (curOff % 4)) % 4;
  curOff += stringDataPad;

  // Map list items
  const mapListOff = curOff;
  const mapItems = [
    { type: 0x0000, size: 1, offset: 0 }, // HEADER_ITEM
    { type: 0x0001, size: stringIdsSize, offset: stringIdsOff }, // STRING_ID_ITEM
    { type: 0x0002, size: typeIdsSize, offset: typeIdsOff }, // TYPE_ID_ITEM
    { type: 0x0003, size: protoIdsSize, offset: protoIdsOff }, // PROTO_ID_ITEM
    { type: 0x0005, size: methodIdsSize, offset: methodIdsOff }, // METHOD_ID_ITEM
    { type: 0x0006, size: classDefsSize, offset: classDefsOff }, // CLASS_DEF_ITEM
    { type: 0x2000, size: classDefsSize, offset: actualClassDataOff }, // CLASS_DATA_ITEM
    { type: 0x2002, size: stringIdsSize, offset: actualStringDataOff }, // STRING_DATA_ITEM
    { type: 0x1000, size: 1, offset: mapListOff }, // MAP_LIST
  ];

  const mapListBuf = Buffer.alloc(4 + mapItems.length * 12);
  mapListBuf.writeUInt32LE(mapItems.length, 0);
  for (let i = 0; i < mapItems.length; i++) {
    const item = mapItems[i];
    mapListBuf.writeUInt16LE(item.type, 4 + i * 12);
    mapListBuf.writeUInt16LE(0, 6 + i * 12); // unused
    mapListBuf.writeUInt32LE(item.size, 8 + i * 12);
    mapListBuf.writeUInt32LE(item.offset, 12 + i * 12);
  }
  curOff += mapListBuf.length;

  const totalFileSize = curOff;
  const dataSize = totalFileSize - dataOff;

  // Now assemble the entire DEX buffer
  const dexBuf = Buffer.alloc(totalFileSize);

  // Magic
  dexBuf.write('dex\n039\0', 0, 8, 'ascii');

  // Skip checksum and signature for now
  dexBuf.writeUInt32LE(totalFileSize, 32);
  dexBuf.writeUInt32LE(headerSize, 36);
  dexBuf.writeUInt32LE(0x12345678, 40); // Endian tag
  dexBuf.writeUInt32LE(0, 44); // linkSize
  dexBuf.writeUInt32LE(0, 48); // linkOff
  dexBuf.writeUInt32LE(mapListOff, 52); // mapOff
  dexBuf.writeUInt32LE(stringIdsSize, 56);
  dexBuf.writeUInt32LE(stringIdsOff, 60);
  dexBuf.writeUInt32LE(typeIdsSize, 64);
  dexBuf.writeUInt32LE(typeIdsOff, 68);
  dexBuf.writeUInt32LE(protoIdsSize, 72);
  dexBuf.writeUInt32LE(protoIdsOff, 76);
  dexBuf.writeUInt32LE(fieldIdsSize, 80);
  dexBuf.writeUInt32LE(fieldIdsOff, 84);
  dexBuf.writeUInt32LE(methodIdsSize, 88);
  dexBuf.writeUInt32LE(methodIdsOff, 92);
  dexBuf.writeUInt32LE(classDefsSize, 96);
  dexBuf.writeUInt32LE(classDefsOff, 100);
  dexBuf.writeUInt32LE(dataSize, 104);
  dexBuf.writeUInt32LE(dataOff, 108);

  // Write string_ids
  for (let i = 0; i < stringIdsSize; i++) {
    dexBuf.writeUInt32LE(actualStringIdsOffsets[i], stringIdsOff + i * 4);
  }

  // Write type_ids
  for (let i = 0; i < typeIdsSize; i++) {
    dexBuf.writeUInt32LE(types[i], typeIdsOff + i * 4);
  }

  // Write proto_ids
  for (let i = 0; i < protoIdsSize; i++) {
    dexBuf.writeUInt32LE(protos[i].shortyIdx, protoIdsOff + i * 12);
    dexBuf.writeUInt32LE(protos[i].returnTypeIdx, protoIdsOff + i * 12 + 4);
    dexBuf.writeUInt32LE(protos[i].parametersOff, protoIdsOff + i * 12 + 8);
  }

  // Write method_ids
  for (let i = 0; i < methodIdsSize; i++) {
    dexBuf.writeUInt16LE(methods[i].classIdx, methodIdsOff + i * 8);
    dexBuf.writeUInt16LE(methods[i].protoIdx, methodIdsOff + i * 8 + 2);
    dexBuf.writeUInt32LE(methods[i].nameIdx, methodIdsOff + i * 8 + 4);
  }

  // Write class_defs
  for (let i = 0; i < classDefsSize; i++) {
    const cd = classDefs[i];
    dexBuf.writeUInt32LE(cd.classIdx, classDefsOff + i * 32);
    dexBuf.writeUInt32LE(cd.accessFlags, classDefsOff + i * 32 + 4);
    dexBuf.writeUInt32LE(cd.superclassIdx, classDefsOff + i * 32 + 8);
    dexBuf.writeUInt32LE(cd.interfacesOff, classDefsOff + i * 32 + 12);
    dexBuf.writeUInt32LE(cd.sourceFileIdx, classDefsOff + i * 32 + 16);
    dexBuf.writeUInt32LE(cd.annotationsOff, classDefsOff + i * 32 + 20);
    dexBuf.writeUInt32LE(cd.classDataOff, classDefsOff + i * 32 + 24);
    dexBuf.writeUInt32LE(cd.staticValuesOff, classDefsOff + i * 32 + 28);
  }

  // Write class_data
  classDataBytes.copy(dexBuf, actualClassDataOff);

  // Write string_data
  totalStringData.copy(dexBuf, actualStringDataOff);

  // Write map_list
  mapListBuf.copy(dexBuf, mapListOff);

  // Compute SHA-1 signature over bytes 32 to end
  const sha1 = crypto.createHash('sha1').update(dexBuf.slice(32)).digest();
  sha1.copy(dexBuf, 12);

  // Compute Adler-32 checksum over bytes 12 to end
  const checksum = adler32(dexBuf, 12);
  dexBuf.writeUInt32LE(checksum, 8);

  return dexBuf;
}
