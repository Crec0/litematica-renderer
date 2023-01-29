<script lang="ts">
    import Viewer from "./lib/Viewer.svelte";
    import {
        BlockDefinition,
        BlockModel,
        TextureAtlas,
        upperPowerOfTwo,
    } from "deepslate";

    const MCMETA = "https://raw.githubusercontent.com/misode/mcmeta/";

    const fetchBlockDefinitions = async () => {
        const res = await fetch(
            `${MCMETA}summary/assets/block_definition/data.min.json`
        );
        const responseJson = await res.json();
        const blockDefinitions: Record<string, BlockDefinition> = {};

        Object.keys(responseJson).forEach((id) => {
            blockDefinitions["minecraft:" + id] = BlockDefinition.fromJson(
                id,
                responseJson[id]
            );
        });

        return blockDefinitions;
    };

    const fetchBlockModels = async () => {
        const res = await fetch(`${MCMETA}summary/assets/model/data.min.json`);
        const responseJson = await res.json();
        const blockModels: Record<string, BlockModel> = {};

        Object.keys(responseJson).forEach((id) => {
            blockModels["minecraft:" + id] = BlockModel.fromJson(
                id,
                responseJson[id]
            );
        });
        Object.values(blockModels).forEach((m: any) =>
            m.flatten({ getBlockModel: (id) => blockModels[id] })
        );

        return blockModels;
    };

    const fetchAndMakeTextureAtlas = async () => {
        const atlas = await new Promise<HTMLImageElement>((res) => {
            const image = new Image();
            image.onload = () => res(image);
            image.crossOrigin = "Anonymous";
            image.src = `${MCMETA}atlas/all/atlas.png`;
        });

        const atlasCanvas = document.createElement("canvas");
        const atlasSize = upperPowerOfTwo(Math.max(atlas.width, atlas.height));
        atlasCanvas.width = atlasSize;
        atlasCanvas.height = atlasSize;

        const atlasCtx = atlasCanvas.getContext("2d")!;
        atlasCtx.drawImage(atlas, 0, 0);

        const atlasData = atlasCtx.getImageData(0, 0, atlasSize, atlasSize);
        const part = 16 / atlasData.width;

        const uvMapResponse = await fetch(`${MCMETA}atlas/all/data.min.json`);
        const responseJson = await uvMapResponse.json();

        const idMap = {};
        Object.keys(responseJson).forEach((id) => {
            const u = responseJson[id][0] / atlasSize;
            const v = responseJson[id][1] / atlasSize;
            idMap["minecraft:" + id] = [u, v, u + part, v + part];
        });

        return new TextureAtlas(atlasData, idMap);
    };

    const fetchLitematicFromLink: () => Promise<
        ReadableStream<Uint8Array>
    > = async () => {
        const urlParams = new URLSearchParams(window.location.search);
        let url: string = null;
        if (urlParams.has("remote-url")) {
            url = urlParams.get("remote-url");
        } else if (urlParams.has("url")) {
            url = urlParams.get("url");
        }

        if (url != null) {
            // This fetch is weird. 
            // If you call it the "normal" way with `fetch(url, { mode: "cors", method:"GET"})`,
            // It will result in a cors error.
            // However, doing it this way works but causes error/red squiggly in vscode. IDK
            // If you find a fix, please fix this. 
            // This cors issue is also only for discord attachments. Maybe because it's from localhost? not sure.
            const response = await fetch({url, mode: "cors"});
            if (response.status == 200) {
                return response.body;
            }
            console.log(response.status, response, url);
        }
        return new Promise((resolve) => resolve(null));
    };

    const fetchData = Promise.all([
        fetchBlockDefinitions(),
        fetchBlockModels(),
        fetchAndMakeTextureAtlas(),
        fetchLitematicFromLink(),
    ]);
</script>

{#await fetchData}
    <p>Loading Data...</p>
{:then [blockDefinitions, models, textureAtlas, fileBytes]}
    <Viewer {blockDefinitions} {models} {textureAtlas} {fileBytes} />
{:catch error}
<!-- TODO replace this with an error component. -->
    <p>An error occured:</p>
    <p>{error}</p>
{/await}
