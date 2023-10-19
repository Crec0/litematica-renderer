import { BlockPos, Structure } from 'deepslate';


function adjustRelativePosition(size: number, position: number) {
    const relativePos = ( size >= 0 ? size - 1 : size + 1 ) + position;
    return Math.max(relativePos, position) - Math.min(relativePos, position) + 1;
}

function populateBlocksFromRegion(structure: Structure, region: Region) {
    let adjustedSizeX = adjustRelativePosition(region.Size.x, region.Position.x);
    let adjustedSizeY = adjustRelativePosition(region.Size.y, region.Position.y);
    let adjustedSizeZ = adjustRelativePosition(region.Size.z, region.Position.z);

    const blockStates = region.BlockStates;

    const bits = Math.max(2, Math.ceil(Math.log2(region.BlockStatePalette.length)));
    const mask = BigInt(( 1 << bits ) - 1);

    for ( let y = 0; y < adjustedSizeY; y++ ) {
        for ( let z = 0; z < adjustedSizeZ; z++ ) {
            for ( let x = 0; x < adjustedSizeX; x++ ) {
                const strideIndex = x + z * adjustedSizeX + y * adjustedSizeX * adjustedSizeZ;
                const offset = strideIndex * bits;
                const arrStartIndex = offset >>> 6;
                const arrEndIndex = ( ( strideIndex + 1 ) * bits - 1 ) >>> 6;
                const startOffset = BigInt(offset & 0x3f);

                const unmaskedIndex = arrStartIndex === arrEndIndex
                    ? blockStates[arrStartIndex] >> startOffset
                    : blockStates[arrStartIndex] >> startOffset | blockStates[arrEndIndex] << ( 64n - startOffset );

                const paletteIndex = unmaskedIndex & mask;
                const block = region.BlockStatePalette[Number(paletteIndex)] ?? { Name: 'minecraft:air' };

                console.log(block.Properties);

                structure.addBlock(BlockPos.create(x, y, z), block.Name, block.Properties);
            }
        }
    }
}