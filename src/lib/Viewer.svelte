<script lang="ts">
    import {
        type BlockDefinition,
        type BlockModel,
        BlockPos,
        type Identifier,
        type Resources,
        Structure,
        StructureRenderer,
        type TextureAtlas,
    } from 'deepslate';
    import { onMount } from 'svelte';

    import { mat4, vec3 } from 'gl-matrix';

    import OpaqueBlocks from '../assets/OpaqueBlocks.json';

    import { parseNbt } from './nbt/NbtUtil';
    import type { Litematic, Region } from './Litematic';


    export let blockDefinitions: Record<string, BlockDefinition>;
    export let models: Record<string, BlockModel>;
    export let textureAtlas: TextureAtlas;

    let canvasElement: HTMLCanvasElement;

    const opaqueBlockIds: Set<string> = new Set(OpaqueBlocks);

    let isLitematicLoaded: boolean = false;

    const resources: Resources = {
        getBlockDefinition(id) {
            return blockDefinitions[id.toString()];
        },
        getBlockModel(id) {
            return models[id.toString()];
        },
        getTextureUV(id) {
            return textureAtlas.getTextureUV(id);
        },
        getTextureAtlas() {
            return textureAtlas.getTextureAtlas();
        },
        getBlockFlags(id: Identifier) {
            return { opaque: opaqueBlockIds.has(id.toString()) };
        },
        getBlockProperties(_id) {
            return null;
        },
        getDefaultBlockProperties(_id) {
            return null;
        },
    };

    const handleFileUpload = (event: Event) => {
        const files = ( event.target as HTMLInputElement ).files;
        if ( files === null || files.length == 0 ) {
            return;
        }
        readFile(files.item(0));
    };

    const readFile = (file: Blob) => {
        const reader = new FileReader();
        reader.readAsArrayBuffer(file);
        reader.onload = () =>
            renderAsStructure(new Uint8Array(reader.result as ArrayBuffer));
    };

    let mousePos = null;
    const rotate = mat4.create();

    // Just to have somewhere to store the negative of the camera.
    let minusCam = vec3.create();
    let view = mat4.create();
    let gl;
    let renderer;
    let center;
    let cameraPos;

    function render() {
        mat4.translate(view, rotate, center);
        renderer.drawStructure(view);
        renderer.drawGrid(view);
    }

    const onMouseDown = (evt) => {
        if ( evt.button === 0 ) {
            evt.preventDefault();
            mousePos = [ evt.clientX, evt.clientY ];
        }
        requestAnimationFrame(render);
    };

    const onMouseMove = (evt) => {
        if ( mousePos ) {
            mat4.rotateY(rotate, rotate, ( evt.clientX - mousePos[0] ) / 200);
            mat4.rotateX(rotate, rotate, ( evt.clientY - mousePos[1] ) / 200);
            mousePos = [ evt.clientX, evt.clientY ];
            requestAnimationFrame(render);
        }
    };

    const stop = (evt) => {
        mousePos = null;
        evt.preventDefault();
    };

    const renderAsStructure = (buffer: Uint8Array) => {
        minusCam = vec3.create();
        view = mat4.create();
        const root = parseNbt(buffer, true)[''] as Litematic;

        const enclosingSize = root.Metadata.EnclosingSize;

        const enclosingSizeLength = enclosingSize.x;
        const enclosingSizeHeight = enclosingSize.y;
        const enclosingSizeDepth = enclosingSize.z;

        const structure = new Structure(
            BlockPos.create(
                enclosingSizeLength,
                enclosingSizeHeight,
                enclosingSizeDepth,
            ),
        );

        const regions = root.Regions;
        let i = 0;

        for ( let region of Object.values(regions) ) {
            populateBlocksFromRegion(structure, region, i++);
        }

        renderer = new StructureRenderer(gl, structure, resources, {
            chunkSize: 8,
        });

        center = vec3.fromValues(-enclosingSizeLength / 2, -enclosingSizeHeight / 2, -enclosingSizeDepth / 2);
        cameraPos = vec3.fromValues(
            0,
            0,
            Math.max(enclosingSizeLength, enclosingSizeHeight) + enclosingSizeDepth / 2,
        );
        mat4.translate(rotate, rotate, vec3.negate(minusCam, cameraPos));
        requestAnimationFrame(render);
    };

    function adjustRelativePosition(size: number, position: number) {
        const relativePos = ( size >= 0 ? size - 1 : size + 1 ) + position;
        return Math.max(relativePos, position) - Math.min(relativePos, position) + 1;
    }

    function populateBlocksFromRegion(structure: Structure, region: Region, offset: Number) {
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

                    structure.addBlock(BlockPos.create(x, y, z), block.Name, block.Properties);
                }
            }
        }
    }

    onMount(() => {
        gl = canvasElement.getContext('webgl');
        canvasElement.addEventListener('mousedown', onMouseDown);
        canvasElement.addEventListener('mousemove', onMouseMove);
        canvasElement.addEventListener('mouseup', stop);
        canvasElement.addEventListener('mouseleave', stop);
    });
</script>

<div>
    {#if !isLitematicLoaded}
        <div class="z-10 absolute flex flex-col">
            <input
                    class=""
                    type="file"
                    accept=".litematic"
                    on:change={handleFileUpload}
            />
        </div>
    {/if}
    <canvas
            width="1000px"
            height="600px"
            bind:this={canvasElement}
            class="border-4">
    </canvas>
</div>
