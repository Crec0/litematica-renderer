enum CompressionType {
    UNCOMPRESSED,
    GZIP,
    ZLIB
}

function compressionMethod(buffer: Uint8Array): CompressionType {
    if (buffer.length < 2)
        throw Error("Invalid data");

    // https://stackoverflow.com/a/43170354
    const higherBits = buffer[0];
    const lowerBits = buffer[1]

    if (higherBits === 0x1f && lowerBits === 0x8b)
        return CompressionType.GZIP;
    else if (higherBits === 0x78 && (lowerBits == 0x01 || lowerBits == 0x5E || lowerBits == 0x9C || lowerBits == 0xDA))
        return CompressionType.ZLIB
    else
        return CompressionType.UNCOMPRESSED
}

export { CompressionType, compressionMethod }