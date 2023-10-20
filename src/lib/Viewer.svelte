<script lang="ts">
    import { Color, PerspectiveCamera, Scene, WebGLRenderer } from 'three';

    import { ResourceManager } from './ResourceManager';
    import Stats from 'three/examples/jsm/libs/stats.module';
    import { MapControls } from 'three/examples/jsm/controls/MapControls';
    import { LitematicRenderer } from './render/LitematicRenderer';


    let isLitematicLoaded = false;

    const stats = new Stats();
    document.body.appendChild(stats.dom);

    const renderer = new WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const scene = new Scene();
    const camera = new PerspectiveCamera(60, window.innerWidth / window.innerHeight);

    const controls = new MapControls(camera, renderer.domElement);
    scene.background = new Color(0x999999);

    camera.position.z = 10;

    const manager = new ResourceManager();
    manager.load();

    const litematicaRenderer = new LitematicRenderer(manager);

    const handleFileUpload = (event: Event) => {
        const files = ( event.target as HTMLInputElement ).files;
        if ( files != null && files.length > 0 ) {
            readFile(files.item(0)!);
        }
    };

    const readFile = (file: Blob) => {
        const reader = new FileReader();
        reader.readAsArrayBuffer(file);
        reader.onload = () => {
            const mesh = litematicaRenderer.render(new Uint8Array(reader.result as ArrayBuffer));
            scene.add(mesh);
        };
    };

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
        stats.update();
    }

    animate();
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
</div>