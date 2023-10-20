import { Mesh, type Scene } from 'three';
import type { Litematic, Region } from '../schema/LitematicSchema';
import type { ResourceManager } from '../ResourceManager';
import { parseNbt } from '../nbt/NbtUtil';
import { litematicSchema } from '../schema/LitematicSchema';


export class LitematicRenderer {

    private resourceManager: ResourceManager

    constructor(_resourceManager: ResourceManager) {
        this.resourceManager = _resourceManager;
    }

    private adjustRelativePosition(size: number, position: number) {
        const relativePos = ( size >= 0 ? size - 1 : size + 1 ) + position;
        return Math.max(relativePos, position) - Math.min(relativePos, position) + 1;
    }

    private populateBlocksFromRegion(mesh: Mesh, region: Region) {
        let adjustedSizeX = this.adjustRelativePosition(region.Size.x, region.Position.x);
        let adjustedSizeY = this.adjustRelativePosition(region.Size.y, region.Position.y);
        let adjustedSizeZ = this.adjustRelativePosition(region.Size.z, region.Position.z);

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
                        ? blockStates[arrStartIndex]! >> startOffset
                        : blockStates[arrStartIndex]! >> startOffset | blockStates[arrEndIndex]! << ( 64n - startOffset );

                    const paletteIndex = Number(unmaskedIndex & mask);
                    const blockState = region.BlockStatePalette[paletteIndex] ?? { Name: 'air' };
                    blockState.Name = blockState.Name.replace('minecraft:', '')
                    const blockMesh = this.resourceManager.generateMeshForBlockState(blockState)
                    blockMesh.position.set(x, y, z);
                    mesh.add(blockMesh);
                }
            }
        }
    }

    render(byteArray: Uint8Array): Mesh {
        const nbt = parseNbt(byteArray, true);
        const reparse = litematicSchema.safeParse(Object.values(nbt)[0]);

        if (reparse.success) {
            const mesh = new Mesh();
            for (const region of Object.values(reparse.data.Regions)) {
                this.populateBlocksFromRegion(mesh, region);
            }
            return mesh;
        } else {
            throw reparse.error
        }
    }
}
