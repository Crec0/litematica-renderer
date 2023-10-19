<script lang="ts">
    import {
        AxesHelper,
        BoxGeometry,
        Color,
        LineBasicMaterial,
        LineSegments,
        Mesh,
        PerspectiveCamera,
        Scene,
        Vector3,
        WebGLRenderer,
        WireframeGeometry,
    } from 'three';

    import { ResourceManager } from './ResourceManager';
    import Stats from 'three/examples/jsm/libs/stats.module';
    import { MapControls } from 'three/examples/jsm/controls/MapControls';


    let isLitematicLoaded = false;

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

    const wireframes = false;

    const meshes = [
        ...manager.generateMeshesForBlock('mossy_cobblestone_wall').values(),
        // ...manager.generateMeshesForBlock('pink_stained_glass').values(),
        // ...manager.generateMeshesForBlock('blue_ice').values(),
    ];

    let dx = 0;
    let dz = 0;
    meshes.forEach((mesh: Mesh) => {
        mesh.position.add(new Vector3(0, dx, dz));
        if ( wireframes ) {
            const wireframe = new LineSegments(new WireframeGeometry(new BoxGeometry()), new LineBasicMaterial({ color: 0xFF00FF }));
            wireframe.position.add(new Vector3(dx + 0.5, 0.5, dz + 0.5));
            scene.add(wireframe);
        }
        scene.add(mesh);
        dz += 2;
    });

    scene.add(new AxesHelper(100));

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