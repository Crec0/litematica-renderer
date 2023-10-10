<script lang="ts">
    import { Color, PerspectiveCamera, Scene, Vector3, WebGLRenderer } from 'three';
    import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

    import { ResourceManager } from './render/ResourceManager';
    import Stats from 'three/examples/jsm/libs/stats.module';


    const stats = new Stats();
    document.body.appendChild(stats.dom);

    const renderer = new WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const scene = new Scene();
    const camera = new PerspectiveCamera(60, window.innerWidth / window.innerHeight);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.listenToKeyEvents(window);
    scene.background = new Color(0x999999);
    controls.dampingFactor = 0.05;
    controls.maxDistance = 600;
    camera.position.z = 10;

    const manager = new ResourceManager();
    manager.load();
    const candles = manager.generateMeshesForBlock('turtle_egg');

    let co = 0;
    for ( const candle of candles.values() ) {
        candle.forEach(cc => {
            cc.position.add(new Vector3(co, 0, 0));
            cc.updateMatrix();
            console.log(cc.position);
            scene.add(cc);
        });
        co++;
    }

    // const candle = new MeshBasicMaterial({
    //     map: new TextureLoader().load('src/assets/atlas.png', (tex) => {
    //         tex.minFilter = NearestFilter;
    //         tex.magFilter = NearestFilter;
    //         tex.colorSpace = SRGBColorSpace;
    //     }),
    //     transparent: true,
    //     alphaTest: 0.5,
    // });
    //
    // // const geom = new BoxGeometry();
    // const geom = new BoxGeometry(2 / 16, 6 / 16, 2 / 16);
    //
    // const adjust = (uvs: number[]) => {
    //     const atlasOffset = [
    //         208,
    //         1056,
    //         16,
    //         16
    //     ];
    //     return [
    //         ( atlasOffset[0] + uvs[0] ) / 2048, ( 1184 - atlasOffset[1] - uvs[1] ) / 1184,
    //         ( atlasOffset[0] + uvs[2] ) / 2048, ( 1184 - atlasOffset[1] - uvs[1] ) / 1184,
    //         ( atlasOffset[0] + uvs[0] ) / 2048, ( 1184 - atlasOffset[1] - uvs[3] ) / 1184,
    //         ( atlasOffset[0] + uvs[2] ) / 2048, ( 1184 - atlasOffset[1] - uvs[3] ) / 1184,
    //     ];
    // };
    //
    // const uv = [ 0, 8, 2, 14 ];
    // const uvs = [
    //     ...adjust(uv),
    //     ...adjust(uv),
    //     // ...adjust(uv),
    //     // ...adjust(uv),
    //
    //     ...adjust([0, 6, 2, 8]),
    //     ...adjust([0, 14, 2, 16]),
    //
    //     ...adjust(uv),
    //     ...adjust(uv),
    // ];
    //
    // geom.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
    //
    // const cccandle = new Mesh(geom, candle);
    // cccandle.position.add(new Vector3(4/16, 0, 0))
    // scene.add(cccandle);
    // scene.add(new LineSegments(new WireframeGeometry(geom)));
    //
    // scene.add(new LineSegments(new WireframeGeometry(new BoxGeometry())));

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
