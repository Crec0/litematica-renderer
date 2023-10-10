<script lang="ts">
    import blockModelsJson from './assets/block-models.json';
    import blockDefitionsJson from './assets/block-definitions.json';
    import atlasJson from './assets/atlas.json';
    // import ThreeJSViewer from "./lib/ThreeJSViewer.svelte";
    import {
        BlockDefinition,
        BlockModel,
        TextureAtlas,
        upperPowerOfTwo,
    } from "deepslate";


    const MCMETA = 'https://raw.githubusercontent.com/misode/mcmeta/';

    const fetchBlockDefinitions = async () => {
        // const res = await fetch(
        //     `${MCMETA}summary/assets/block_definition/data.min.json`
        // );
        // const responseJson = await res.json();
        const responseJson = blockDefitionsJson;
        const blockDefinitions: Record<string, BlockDefinition> = {};

        Object.keys(responseJson).forEach((id) => {
            blockDefinitions['minecraft:' + id] = BlockDefinition.fromJson(
                id,
                responseJson[id],
            );
        });

        return blockDefinitions;
    };

    const fetchBlockModels = async () => {
        // const res = await fetch(`${MCMETA}summary/assets/model/data.min.json`);
        // const responseJson = await res.json();

        const responseJson = blockModelsJson;

        const blockModels: Record<string, BlockModel> = {};

        Object.keys(responseJson).forEach((id) => {
            blockModels['minecraft:' + id] = BlockModel.fromJson(
                id,
                responseJson[id],
            );
        });
        Object.values(blockModels).forEach((m: any) =>
            m.flatten({ getBlockModel: (id) => blockModels[id] }),
        );

        return blockModels;
    };

    const fetchAndMakeTextureAtlas = async () => {
        const atlas = await new Promise<HTMLImageElement>((res) => {
            const image = new Image();
            image.onload = () => res(image);
            image.crossOrigin = 'Anonymous';
            image.src = `${ MCMETA }atlas/all/atlas.png`;
        });

        const atlasCanvas = document.createElement('canvas');
        const atlasSize = upperPowerOfTwo(Math.max(atlas.width, atlas.height));
        atlasCanvas.width = atlasSize;
        atlasCanvas.height = atlasSize;

        const atlasCtx = atlasCanvas.getContext('2d')!;
        atlasCtx.drawImage(atlas, 0, 0);

        const atlasData = atlasCtx.getImageData(0, 0, atlasSize, atlasSize);
        const part = 16 / atlasData.width;

        // const uvMapResponse = await fetch(`${MCMETA}atlas/all/data.min.json`);
        // const responseJson = await uvMapResponse.json();
        const responseJson = atlasJson;

        const idMap = {};
        Object.keys(responseJson).forEach((id) => {
            const u = responseJson[id][0] / atlasSize;
            const v = responseJson[id][1] / atlasSize;
            idMap['minecraft:' + id] = [ u, v, u + part, v + part ];
        });

        return new TextureAtlas(atlasData, idMap);
    };

    // Disabling this until I get a proxy to bypass cors issue
    // const fetchLitematicFromLink: () => Promise<Uint8Array> = async () => {
    //     const urlParams = new URLSearchParams(window.location.search);
    //     let url: string = "null";
    //     if (urlParams.has("remote-url")) {
    //         url = urlParams.get("remote-url");
    //     } else if (urlParams.has("url")) {
    //         url = urlParams.get("url");
    //     }
    //     if (url != null) {
    //         const response = await fetch(url);
    //         if (response.status == 200) {
    //             const readResult = await response.body.getReader().read();
    //             console.log(readResult)
    //             return new Promise((resolve) => resolve(readResult.value));
    //         }
    //         console.log(response.status, response, url);
    //     }
    //     return new Promise((resolve) => resolve(null));
    // };

    const fetchData = Promise.all([
        fetchBlockDefinitions(),
        fetchBlockModels(),
        fetchAndMakeTextureAtlas(),
    ]);
</script>

{#await fetchData}
    <p>Loading Data...</p>
{:then [blockDefinitions, models, textureAtlas]}
     <Viewer {blockDefinitions} {models} {textureAtlas} />
<!--    <ThreeJSViewer {blockDefinitions} {models} {textureAtlas}/>-->
{:catch error}
    <!-- TODO replace this with an error component. -->
    <p>An error occured:</p>
    <p>{error}</p>
{/await}
