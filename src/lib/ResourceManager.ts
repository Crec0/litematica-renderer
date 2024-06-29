import BLOCK_DEFINITIONS from '../assets/block-definitions.json';
import BLOCK_MODELS from '../assets/block-models.json';
import ATLAS_DATA from '../assets/atlas.json';
import {
    BackSide,
    BoxGeometry,
    Float32BufferAttribute,
    ImageLoader,
    Mesh,
    MeshBasicMaterial,
    NearestFilter,
    Object3D,
    SRGBColorSpace,
    Texture,
    Vector3,
} from 'three';
import { randInt } from 'three/src/math/MathUtils';
import deepmerge from 'deepmerge';
import { blockDefinionSchema, type BlockDefinition, type BlockVariant } from './schema/BlockDefinitionSchema';
import { Axis, type BlockModel, blockModelSchema, type Face } from './schema/BlockModelSchema';
import type { BlockState } from './schema/LitematicSchema';


type FixedNumberArray<
    N extends number,
    R extends readonly number[] = [],
> = R['length'] extends N ? R : FixedNumberArray<N, readonly [ number, ...R ]>;

function cast<T>(object: any): T {
    return object as unknown as T;
}

const DEG_TO_RAD = Math.PI / 180;
const SCALE_22_5 = 1 / Math.cos(( Math.PI / 8 ));
const SCALE_45 = 1 / Math.cos(( Math.PI / 4 ));
const MID_VECTOR = new Vector3(0.5, 0.5, 0.5);


export class ResourceManager {
    private readonly blockDefinitions: Map<string, BlockDefinition> = new Map();
    private readonly blockModels: Map<string, BlockModel> = new Map();

    private readonly blankUV: FixedNumberArray<8> = [ 0, 0, 0, 0, 0, 0, 0, 0 ];

    private readonly atlasWidth: number;
    private readonly atlasHeight: number;
    private readonly atlas: MeshBasicMaterial;

    constructor() {
        const atlasImage = new ImageLoader().load('src/assets/atlas.png');
        this.atlasHeight = atlasImage.height;
        this.atlasWidth = atlasImage.width;

        this.atlas = this.createAtlas(atlasImage);
    }

    createAtlas(image: HTMLImageElement): MeshBasicMaterial {
        const atlasTex = new Texture(image);
        atlasTex.anisotropy = NearestFilter;
        atlasTex.colorSpace = SRGBColorSpace;
        atlasTex.magFilter = NearestFilter;
        atlasTex.minFilter = NearestFilter;
        atlasTex.needsUpdate = true;

        return new MeshBasicMaterial({
            map: atlasTex,
            side: BackSide,
            alphaTest: 0.1,
            transparent: true,
        });
    }

    load(): void {
        Object.entries(BLOCK_DEFINITIONS).forEach(([ name, value ]: [ string, unknown ]) => {
            const parseResult = blockDefinionSchema.safeParse(value);
            if ( parseResult.success ) {
                this.blockDefinitions.set(name, cast(parseResult.data));
            } else {
                console.error('Failed to load definition:', name);
            }
        });

        Object.entries(BLOCK_MODELS).forEach(([ name, value ]: [ string, unknown ]) => {
            const parseResult = blockModelSchema.safeParse(value);
            if ( parseResult.success ) {
                this.blockModels.set(name, cast(parseResult.data));
            } else {
                console.error('Failed to load definition:', name);
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
            if (parent.elements && model.elements) {
                delete parent.elements;
            }
            return deepmerge(parent, model);
        }
        return model;
    }

    private translateUV(textureName: string, uvs: FixedNumberArray<4>): FixedNumberArray<8> {
        const atlasOffset: FixedNumberArray<4> = cast(ATLAS_DATA[textureName as keyof typeof ATLAS_DATA]);
        return [
            ( atlasOffset[0] + uvs[0] ) / this.atlasWidth, ( this.atlasHeight - 16 - atlasOffset[1] + uvs[3] ) / this.atlasHeight,
            ( atlasOffset[0] + uvs[2] ) / this.atlasWidth, ( this.atlasHeight - 16 - atlasOffset[1] + uvs[3] ) / this.atlasHeight,
            ( atlasOffset[0] + uvs[0] ) / this.atlasWidth, ( this.atlasHeight - 16 - atlasOffset[1] + uvs[1] ) / this.atlasHeight,
            ( atlasOffset[0] + uvs[2] ) / this.atlasWidth, ( this.atlasHeight - 16 - atlasOffset[1] + uvs[1] ) / this.atlasHeight,
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

    private getUVs(model: BlockModel, face: Face | undefined, defaultUVs: FixedNumberArray<4>) {
        if ( face == null ) {
            return this.blankUV;
        }
        const textureName = this.findTextureName(model, face.texture);
        const uvs: FixedNumberArray<4> = cast(face.uv == null ? defaultUVs : face.uv);
        return this.translateUV(textureName, uvs);
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
        const scaleFactor = Math.abs(angle) === 22.5 ? SCALE_22_5 : SCALE_45;
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

    private stringifyBlockstate(blockState: BlockState): string {
        const props = blockState.Properties;
        const stringifyProps = props == null ? '' : Object.entries(props).map(([ k, v ]) => `${ k }=${ v }`).join(',');
        return `${ blockState.Name }[${ stringifyProps }]`;
    }

    private variantMesh(block: BlockState, variant: BlockVariant): Mesh {
        if ( block.Name === 'air' || block.Name === 'void_air' || block.Name === 'cave_air' ) {
            return new Mesh();
        }

        const model = this.getFlattenedModel(variant.model);
        if ( !model.elements ) {
            throw Error(`Flattened model doesn't have elements tag. Cannot render: ${ this.stringifyBlockstate(block) }]`);
        }
        if ( !model.textures ) {
            throw Error(`Flattened model doesn't have textures. Cannot render: ${ this.stringifyBlockstate(block) }]`);
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
            const meshOffset = new Vector3(f.x - ( f.x - t.x ) / 2, f.y - ( f.y - t.y ) / 2, f.z - ( f.z - t.z ) / 2);

            f.multiplyScalar(16);
            t.multiplyScalar(16);

            const uvs = [
                ...this.getUVs(model, elem.faces.east, [ t.x, t.y, f.x, f.y ]),
                ...this.getUVs(model, elem.faces.west, [ t.z, t.y, f.z, f.y ]),
                ...this.getUVs(model, elem.faces.down, [ f.x, f.z, t.x, t.z ]),
                ...this.getUVs(model, elem.faces.up, [ f.x, f.z, t.x, t.z ]),
                ...this.getUVs(model, elem.faces.north, [ t.x, t.y, f.x, f.y ]),
                ...this.getUVs(model, elem.faces.south, [ t.z, t.y, f.z, f.y ]),
            ];

            box.setAttribute('uv', new Float32BufferAttribute(uvs, 2));

            const mesh = new Mesh(box, this.atlas);
            mesh.position.add(meshOffset);

            const rot = elem.rotation;
            if ( rot != null ) {
                const pivot = new Vector3().fromArray(rot.origin).divideScalar(16);
                this.rotateOnPivot(mesh, rot.axis, rot.angle, pivot);

                if ( rot.rescale ) {
                    const scaleVector = this.axisToScaleVector(rot.axis, rot.angle);
                    mesh.scale.multiply(scaleVector);
                }
            }

            unifiedMesh.add(mesh);
        }

        unifiedMesh.children.forEach(c => c.position.subScalar(0.5));
        unifiedMesh.position.addScalar(0.5);

        if ( variant.y != null ) {
            this.rotateOnPivot(unifiedMesh, Axis.Y, variant.y);
        }
        if ( variant.x != null ) {
            this.rotateOnPivot(unifiedMesh, Axis.X, variant.x);
        }

        return unifiedMesh;
    }

    private pickOneVariant(variants: BlockVariant | BlockVariant[]): BlockVariant {
        return variants instanceof Array ? variants[randInt(0, variants.length)]! : variants;
    }

    private calculateMatchingPropsScore(variant: string, props: Record<string, string>) {
        return variant.split(',')
            .reduce((acc, prop) => {
                const [ k, v ] = prop.split('=');
                acc += k! in props && props[k!] == v ? 1 : 0;
                return acc;
            }, 0);
    }

    findApplicableVariants(state: BlockState, definition: BlockDefinition): BlockVariant[] {
        const variantsToApply: BlockVariant[] = [];

        if ( definition.variants != null ) {
            const variantsNames = Object.keys(definition.variants);

            if ( variantsNames.length == 0 ) {
                throw Error('Impossible case where it has 0 variants');
            }

            let bestMatch = variantsNames[0]!;
            let bestMatchScore = -Infinity;

            if ( state.Properties != null ) {
                for ( const variant of variantsNames ) {
                    const variantMatchScore = this.calculateMatchingPropsScore(variant, state.Properties);
                    if ( bestMatchScore <= variantMatchScore ) {
                        bestMatchScore = variantMatchScore;
                        bestMatch = variant;
                    }
                }
            }

            const variant = this.pickOneVariant(definition.variants[bestMatch]!);
            variantsToApply.push(variant);

        } else if ( definition.multipart != null ) {

            for ( const multipart of definition.multipart ) {
                if ( multipart.when == undefined || state.Properties == undefined ) {
                    variantsToApply.push(this.pickOneVariant(multipart.apply));
                    continue;
                }

                let allMatch = true;
                for ( const [ prop, val ] of Object.entries(multipart.when) ) {
                    allMatch &&= prop in state.Properties! && state.Properties![prop] == val;
                }
                if ( allMatch ) {
                    variantsToApply.push(this.pickOneVariant(multipart.apply));
                }
            }

        } else {
            throw Error(`Block definition is missing both variants and multipart. Culprit: ${ state.Name }`);
        }

        return variantsToApply;
    }

    generateMeshForBlockState(blockState: BlockState): Mesh {
        const definition = this.blockDefinitions.get(blockState.Name);
        if ( definition == null ) {
            throw Error(`${ blockState.Name } is not present in the model map.`);
        }

        return this
            .findApplicableVariants(blockState, definition)
            .reduce((mesh, variant) => {
                mesh.add(this.variantMesh(blockState, variant));
                return mesh;
            }, new Mesh());
    }
}
