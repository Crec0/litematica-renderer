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

function cast<T>(object: any): T {
    return object as unknown as T;
}

const DEG_TO_RAD = Math.PI / 180;
const SCALE_22_5 = 1 / Math.cos(( Math.PI / 8 ));
const SCALE_45 = 1 / Math.cos(( Math.PI / 4 ));
const MID_VECTOR = new Vector3(0.5, 0.5, 0.5);


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
        const atlasOffset = cast<FixedArray<number, 4>>(ATLAS_DATA[textureName as keyof typeof ATLAS_DATA]);

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
        const uvs = ( face.uv == null ? this.fullFaceUV : face.uv );
        return this.translateUV(textureName, cast<FixedArray<number, 4>>(uvs));
    }

    private axisToAxisVector(axis: Axis): Vector3 {
        switch ( axis ) {
        case Axis.X:
            return new Vector3(1, 0, 0);
        case Axis.Y:
            return new Vector3(0, 1, 0);
        case Axis.Z:
            return new Vector3(0, 0, 1);
        }
    }

    private axisToScaleVector(axis: Axis, angle: number): Vector3 {
        const scaleFactor = angle === 22.5 ? SCALE_22_5 : SCALE_45;
        switch ( axis ) {
        case Axis.X:
            return new Vector3(1, scaleFactor, scaleFactor);
        case Axis.Y:
            return new Vector3(scaleFactor, 1, scaleFactor);
        case Axis.Z:
            return new Vector3(scaleFactor, scaleFactor, 1);
        }
    }

    rotateOnPivot(object: Object3D, axis: Axis, angle: number, pivot: Vector3 = MID_VECTOR) {
        const radians = angle * DEG_TO_RAD;
        const axisVector = this.axisToAxisVector(axis);
        const pos = new Vector3().copy(pivot);
        object.position.sub(pos);
        object.position.applyAxisAngle(axisVector, radians);
        object.position.add(pos);
        object.rotateOnAxis(axisVector, radians);
    }

    private variantMesh(blockName: string, variantName: string, variant: Variant): Mesh {
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

        let unifiedMesh = new Mesh();

        for ( const elem of model.elements ) {
            const f = new Vector3().fromArray(elem.from).divideScalar(16);
            const t = new Vector3().fromArray(elem.to).divideScalar(16);
            const box = new BoxGeometry(f.x - t.x, f.y - t.y, f.z - t.z);

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

            const localOffset = new Vector3(f.x - ( f.x - t.x ) / 2, f.y - ( f.y - t.y ) / 2, f.z - ( f.z - t.z ) / 2);
            mesh.position.add(localOffset);

            const rot = elem.rotation;
            if ( rot != null ) {
                const pivot = new Vector3().fromArray(rot.origin).divideScalar(16);
                this.rotateOnPivot(mesh, rot.axis, rot.angle, pivot);

                if ( rot.rescale ) {
                    const scaleVector = this.axisToScaleVector(rot.axis, Math.abs(rot.angle));
                    mesh.scale.multiply(scaleVector);
                }
            }

            unifiedMesh.add(mesh);
        }

        unifiedMesh.children.forEach(c => c.position.subScalar(0.5));
        unifiedMesh.position.addScalar(0.5);

        if ( variant.y != null ) {
            console.log(blockName, variantName, 'Y');
            this.rotateOnPivot(unifiedMesh, Axis.Y, variant.y);
        }
        if ( variant.x != null ) {
            console.log(blockName, variantName, 'X');
            this.rotateOnPivot(unifiedMesh, Axis.X, variant.x);
        }

        return unifiedMesh;
    }

    generateMeshesForBlock(blockName: string): Map<string, Mesh[]> {
        const definition = this.blockDefinitions.get(blockName);
        if ( !definition?.variants ) {
            throw Error(`${ blockName } is not present in the model map.`);
        }
        const meshes = new Map<string, Mesh[]>();
        for ( const variantName of Object.keys(definition.variants) ) {
            meshes.set(variantName, this.generateMeshesForBlockVariant(blockName, variantName));
        }
        return meshes;
    }


    generateMeshesForBlockVariant(blockName: string, variant: string): Mesh[] {
        const definition = this.blockDefinitions.get(blockName);
        if ( !definition?.variants ) {
            throw Error(`${ blockName } is not present in the model map.`);
        }
        const variations = definition.variants[variant];

        if ( variations == null ) {
            throw Error(`${ blockName }[${ variant }] doesn't exit.`);
        }

        return variations instanceof Array
            ? Object.values(variations).flatMap(v => this.variantMesh(blockName, variant, v))
            : [ this.variantMesh(blockName, variant, variations) ];
    }
}