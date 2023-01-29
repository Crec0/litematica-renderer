<script lang="ts">
    import type { BlockDefinition, BlockModel, TextureAtlas } from "deepslate";
    import { onMount } from "svelte";

    export let blockDefinitions: Record<string, BlockDefinition>;
    export let models: Record<string, BlockModel>;
    export let textureAtlas: TextureAtlas;

    let canvasElement: HTMLCanvasElement;

    onMount(() => {
        const ctx = canvasElement.getContext("webgl");
    });
</script>

<canvas bind:this={canvasElement} class="border-4 w-screen h-screen" />
