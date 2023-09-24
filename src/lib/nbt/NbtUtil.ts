import { inflate } from "pako";
import { NbtReader } from "./NbtReader";
import { compressionMethod, CompressionType } from "./CompressionUtil"


export const Tags = [
    'end',
    'byte',
    'short',
    'int',
    'long',
    'float',
    'double',
    'byteArray',
    'string',
    'list',
    'compound',
    'intArray',
    'longArray',
]

export function parseNbt(byteBuffer: Uint8Array, simplified: boolean = false) {
    const uncompressedBuffer = compressionMethod(byteBuffer) == CompressionType.UNCOMPRESSED
        ? byteBuffer
        : inflate(byteBuffer);

    const nbtReader = new NbtReader(uncompressedBuffer)
    return nbtReader.read(simplified);
}
