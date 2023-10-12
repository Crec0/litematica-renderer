import BLOCK_DEFINITIONS from '../../assets/block-definitions.json';
import BLOCK_MODELS from '../../assets/block-models.json';
import ATLAS_DATA from '../../assets/atlas.json';
import type { BlockModelMap } from './BlockModelSchema';
import { BlockModelSchema } from './BlockModelSchema';
import type { BlockDefinitionMap } from './BlockDefinitionSchema';
import { BlockDefinitionSchema } from './BlockDefinitionSchema';
import type { Variant } from './BlockDefinition';
import type { Texture } from 'three';
import {
    BoxGeometry,
    DoubleSide,
    Float32BufferAttribute,
    Group,
    Mesh,
    MeshBasicMaterial,
    NearestFilter,
    Object3D,
    SRGBColorSpace,
    TextureLoader,
    Vector3,
} from 'three';
import type { BlockModel, Face } from './BlockModel';
import { Axis } from './BlockModel';


type FixedArray<
    T,
    N extends number,
    R extends readonly T[] = [],
> = R['length'] extends N ? R : FixedArray<T, N, readonly [ T, ...R ]>;


export class ResourceManager {
    private blockDefinitions: BlockDefinitionMap = new Map();
    private blockModels: BlockModelMap = new Map();
    private textureAtlas = new TextureLoader().load('src/assets/atlas.png', (texture: Texture) => {
        texture.magFilter = NearestFilter;
        texture.minFilter = NearestFilter;
        texture.colorSpace = SRGBColorSpace;
        texture.flipY = false;
    });

    private genericMaterial = new MeshBasicMaterial({
        map: this.textureAtlas,
        side: DoubleSide,
        alphaTest: 0.5,
        transparent: true,
    });

    private blankUV = [ 0, 0, 0, 0, 0, 0, 0, 0 ];
    private fullFaceUV = [ 0, 0, 16, 16 ];

    load(): void {
        Object.entries(BLOCK_DEFINITIONS).forEach(([ name, value ]: [ string, unknown ]) => {
            const parseResult = BlockDefinitionSchema.safeParse(value);
            if ( parseResult.success ) {
                this.blockDefinitions.set(name, parseResult.data);
            } else {
                console.log('Failed to load definition:', name);
            }
        });

        Object.entries(BLOCK_MODELS).forEach(([ name, value ]: [ string, unknown ]) => {
            const parseResult = BlockModelSchema.safeParse(value);
            if ( parseResult.success ) {
                this.blockModels.set(name, parseResult.data);
            } else {
                console.log('Failed to load definition:', name);
            }
        });
    }

    getModel(name: string): BlockModel {
        const model = this.blockModels.get(name.replace('minecraft:', ''));
        if ( model ) {
            return structuredClone(model);
        }
        throw Error(`Model doesn't exist: ${ name }`);
    }

    private getFlattenedModel(name: string): BlockModel {
        const model = this.getModel(name);
        if ( model.parent ) {
            const parent = this.getFlattenedModel(model.parent);
            delete model.parent;
            return Object.assign(parent, model);
        }
        return model;
    }

    private translateUV(textureName: string, uvs: FixedArray<number, 4>): FixedArray<number, 8> {
        const atlasOffset = ATLAS_DATA[textureName as keyof typeof ATLAS_DATA] as unknown as FixedArray<number, 4>;

        return [
            ( atlasOffset[0] + uvs[0] ) / 2048, ( atlasOffset[1] + uvs[3] ) / 1184,
            ( atlasOffset[0] + uvs[2] ) / 2048, ( atlasOffset[1] + uvs[3] ) / 1184,
            ( atlasOffset[0] + uvs[0] ) / 2048, ( atlasOffset[1] + uvs[1] ) / 1184,
            ( atlasOffset[0] + uvs[2] ) / 2048, ( atlasOffset[1] + uvs[1] ) / 1184,
        ];
    }

    private findTextureName(model: BlockModel, texture: string): string {
        if ( model.textures == null ) {
            throw Error(`Model textures are null: ${ texture }`);
        }
        const cleanedName = texture.replace('#', '');
        if ( cleanedName in model.textures ) {
            return this.findTextureName(model, model.textures[cleanedName]!);
        }
        return texture.replace('minecraft:', '');
    }

    private getUVs(model: BlockModel, face: Face | undefined) {
        if ( face == null ) {
            return this.blankUV;
        }
        const textureName = this.findTextureName(model, face.texture);
        const uvs = ( face.uv == null ? this.fullFaceUV : face.uv ) as unknown as FixedArray<number, 4>;
        return this.translateUV(textureName, uvs);
    }

    private rotateAboutPoint(obj: Object3D, point: Vector3, axis: Vector3, theta: number, pointIsWorld: boolean = false) {
        if ( pointIsWorld ) {
            obj.parent?.localToWorld(obj.position);
        }
        obj.position.sub(point);
        obj.position.applyAxisAngle(axis, theta);
        obj.position.add(point);
        if ( pointIsWorld ) {
            obj.parent?.worldToLocal(obj.position);
        }
        obj.rotateOnAxis(axis, theta);
    }

    private axisToVector(axis: Axis): Vector3 {
        switch ( axis ) {
        case Axis.X:
            return new Vector3(1, 0, 0);
        case Axis.Y:
            return new Vector3(0, 1, 0);
        case Axis.Z:
            return new Vector3(0, 0, 1);
        }
    }

    private variantMesh(blockName: string, variantName: string, variant: Variant): Group {
        const model = this.getFlattenedModel(variant.model);
        if ( !model.elements ) {
            throw Error(`Flattened model doesn't have elements tag. Cannot render: ${ blockName }[${ variantName }]`);
        }
        if ( !model.textures ) {
            throw Error(`Flattened model doesn't have textures. Cannot render: ${ blockName }[${ variantName }]`);
        }
        // Delete unnecessary stuff
        delete model.textures['particle'];
        delete model.display;
        delete model.gui_light;
        delete model.ambientocclusion;

        let group = new Group();

        for ( const elem of model.elements ) {
            const f = elem.from as unknown as FixedArray<number, 4>;
            const t = elem.to as unknown as FixedArray<number, 4>;
            const box = new BoxGeometry(( f[0] - t[0] ) / 16, ( f[1] - t[1] ) / 16, ( f[2] - t[2] ) / 16);

            const uvs = [
                ...this.getUVs(model, elem.faces.east),
                ...this.getUVs(model, elem.faces.west),
                ...this.getUVs(model, elem.faces.down),
                ...this.getUVs(model, elem.faces.up),
                ...this.getUVs(model, elem.faces.north),
                ...this.getUVs(model, elem.faces.south),
            ];

            box.setAttribute('uv', new Float32BufferAttribute(uvs, 2));

            const mesh = new Mesh(box, this.genericMaterial);
            mesh.position.add(new Vector3(f[0] + ( f[0] - t[0] ) / 2, f[1] - ( f[1] - t[1] ) / 2, f[2] + ( f[2] - t[2] ) / 2).divideScalar(16));
            group.add(mesh);

            if ( elem.rotation != null ) {
                const origin = elem.rotation.origin as unknown as FixedArray<number, 3>;
                const point = new Vector3(origin[0], origin[1], origin[2]).divideScalar(16);
                const angle = elem.rotation.angle / 180 * Math.PI;
                this.rotateAboutPoint(mesh, point, this.axisToVector(elem.rotation.axis), angle);
            }
        }

        return group;
    }

    generateMeshesForBlock(blockName: string): Map<string, Group[]> {
        const definition = this.blockDefinitions.get(blockName);
        if ( !definition?.variants ) {
            throw Error(`${ blockName } is not present in the model map.`);
        }

        const meshes = new Map<string, Group[]>();

        for ( const [ variantName, variations ] of Object.entries(definition.variants) ) {
            meshes.set(
                variantName,
                variations instanceof Array
                    ? Object.values(variations).flatMap(v => this.variantMesh(blockName, variantName, v))
                    : [ this.variantMesh(blockName, variantName, variations) ],
            );
        }

        return meshes;
    }
}