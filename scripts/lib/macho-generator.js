/**
 * Canonical 64-bit Mach-O Executable Generator
 * Produces genuine Mach-O binary format adhering to Apple Mach-O specification
 */

const MH_MAGIC_64 = 0xfeedfacf;
const CPU_TYPE_ARM64 = 0x0100000c;
const CPU_TYPE_X86_64 = 0x01000007;
const MH_EXECUTE = 0x00000002;
const MH_PIE = 0x00200000;
const MH_DYLDLINK = 0x00000004;
const MH_TWOLEVEL = 0x00000080;

const LC_SEGMENT_64 = 0x00000019;
const LC_MAIN = 0x80000028;

export function generateCanonicalMachO(arch = 'arm64') {
  const cpuType = arch === 'arm64' ? CPU_TYPE_ARM64 : CPU_TYPE_X86_64;

  const headerSize = 32; // mach_header_64
  const pageZeroCmdSize = 72; // segment_command_64 for __PAGEZERO
  const textCmdSize = 72 + 80; // segment_command_64 for __TEXT + section_64 for __text
  const mainCmdSize = 24; // entry_point_command (LC_MAIN)

  const sizeofcmds = pageZeroCmdSize + textCmdSize + mainCmdSize;
  const ncmds = 3;

  const totalHeaderSize = headerSize + sizeofcmds;
  const textSectionOffset = 0x4000;
  const totalFileSize = textSectionOffset + 0x1000; // 20KB total

  const buf = Buffer.alloc(totalFileSize);

  // 1. mach_header_64
  buf.writeUInt32LE(MH_MAGIC_64, 0);
  buf.writeUInt32LE(cpuType, 4);
  buf.writeUInt32LE(0x00000000, 8); // cpusubtype
  buf.writeUInt32LE(MH_EXECUTE, 12);
  buf.writeUInt32LE(ncmds, 16);
  buf.writeUInt32LE(sizeofcmds, 20);
  buf.writeUInt32LE(MH_PIE | MH_DYLDLINK | MH_TWOLEVEL, 24);
  buf.writeUInt32LE(0, 28); // reserved

  let offset = headerSize;

  // 2. LC_SEGMENT_64: __PAGEZERO
  buf.writeUInt32LE(LC_SEGMENT_64, offset);
  buf.writeUInt32LE(pageZeroCmdSize, offset + 4);
  buf.write('__PAGEZERO', offset + 8, 16, 'ascii');
  buf.writeBigUInt64LE(0n, offset + 24); // vmaddr
  buf.writeBigUInt64LE(0x100000000n, offset + 32); // vmsize (4GB)
  buf.writeBigUInt64LE(0n, offset + 40); // fileoff
  buf.writeBigUInt64LE(0n, offset + 48); // filesize
  buf.writeUInt32LE(0, offset + 56); // maxprot
  buf.writeUInt32LE(0, offset + 60); // initprot
  buf.writeUInt32LE(0, offset + 64); // nsects
  buf.writeUInt32LE(0, offset + 68); // flags

  offset += pageZeroCmdSize;

  // 3. LC_SEGMENT_64: __TEXT
  buf.writeUInt32LE(LC_SEGMENT_64, offset);
  buf.writeUInt32LE(textCmdSize, offset + 4);
  buf.write('__TEXT', offset + 8, 16, 'ascii');
  buf.writeBigUInt64LE(0x100000000n, offset + 24); // vmaddr
  buf.writeBigUInt64LE(0x8000n, offset + 32); // vmsize
  buf.writeBigUInt64LE(0n, offset + 40); // fileoff
  buf.writeBigUInt64LE(BigInt(totalFileSize), offset + 48); // filesize
  buf.writeUInt32LE(0x07, offset + 56); // maxprot (rwx)
  buf.writeUInt32LE(0x05, offset + 60); // initprot (r-x)
  buf.writeUInt32LE(1, offset + 64); // nsects = 1
  buf.writeUInt32LE(0, offset + 68); // flags

  // Section 64: __text inside __TEXT
  const sectOffset = offset + 72;
  buf.write('__text', sectOffset, 16, 'ascii');
  buf.write('__TEXT', sectOffset + 16, 16, 'ascii');
  buf.writeBigUInt64LE(0x100004000n, sectOffset + 32); // addr
  buf.writeBigUInt64LE(0x100n, sectOffset + 40); // size
  buf.writeUInt32LE(textSectionOffset, sectOffset + 48); // offset
  buf.writeUInt32LE(2, sectOffset + 52); // align (4 bytes)
  buf.writeUInt32LE(0, sectOffset + 56); // reloff
  buf.writeUInt32LE(0, sectOffset + 60); // nreloc
  buf.writeUInt32LE(0x80000400, sectOffset + 64); // flags (pure instructions | some instructions)

  offset += textCmdSize;

  // 4. LC_MAIN: entry_point_command
  buf.writeUInt32LE(LC_MAIN, offset);
  buf.writeUInt32LE(mainCmdSize, offset + 4);
  buf.writeBigUInt64LE(BigInt(textSectionOffset), offset + 8); // entryoff
  buf.writeBigUInt64LE(0n, offset + 16); // stacksize

  // Minimal assembly instruction at entry point:
  // For arm64: mov w0, #0 (0x52800000), ret (0xd65f03c0)
  // For x86_64: xor eax, eax (0x31 0xc0), ret (0xc3)
  if (arch === 'arm64') {
    buf.writeUInt32LE(0x52800000, textSectionOffset);
    buf.writeUInt32LE(0xd65f03c0, textSectionOffset + 4);
  } else {
    buf[textSectionOffset] = 0x31;
    buf[textSectionOffset + 1] = 0xc0;
    buf[textSectionOffset + 2] = 0xc3;
  }

  return buf;
}
