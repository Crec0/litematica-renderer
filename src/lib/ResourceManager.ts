import BLOCK_DEFINITIONS from '../assets/block-definitions.json';
import BLOCK_MODELS from '../assets/block-models.json';
import ATLAS_DATA from '../assets/atlas.json';
import {
    BackSide,
    Float32BufferAttribute,
    Group,
    ImageLoader,
    Mesh,
    MeshBasicMaterial,
    NearestFilter,
    Object3D,
    PlaneGeometry,
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

const AXIS_ROT_OFFSET_LUT = {
    'north': {
        xRot: 0,
        yRot: 0,
        xOffset: 0,
        yOffset: 0,
        zOffset: -0.5,
    },
    'south': {
        xRot: 0,
        yRot: 180,
        xOffset: 0,
        yOffset: 0,
        zOffset: 0.5,
    },
    'east': {
        xRot: 0,
        yRot: -90,
        xOffset: 0.5,
        yOffset: 0,
        zOffset: 0,
    },
    'west': {
        xRot: 0,
        yRot: 90,
        xOffset: -0.5,
        yOffset: 0,
        zOffset: 0,
    },
    'up': {
        xRot: 90,
        yRot: 180,
        xOffset: 0,
        yOffset: 0.5,
        zOffset: 0,
    },
    'down': {
        xRot: -90,
        yRot: 180,
        xOffset: 0,
        yOffset: -0.5,
        zOffset: 0,
    },
} as const;

type Side = keyof typeof AXIS_ROT_OFFSET_LUT;


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
        atlasTex.flipY = false;

        return new MeshBasicMaterial({
            map: atlasTex,
            side: FrontSide,
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
            if ( parent.elements && model.elements ) {
                delete parent.elements;
            }
            return deepmerge(parent, model);
        }
        return model;
    }

    private translateUV(textureName: string, uvs: FixedNumberArray<4>): FixedNumberArray<8> {
        const atlasOffset: FixedNumberArray<4> = cast(ATLAS_DATA[textureName as keyof typeof ATLAS_DATA]);
        return [ //1, 1, 0, 1, 1, 0, 0, 0
            ( atlasOffset[0] + uvs[2] ) / this.atlasWidth, ( atlasOffset[1] + uvs[1] ) / this.atlasHeight,
            ( atlasOffset[0] + uvs[0] ) / this.atlasWidth, ( atlasOffset[1] + uvs[1] ) / this.atlasHeight,
            ( atlasOffset[0] + uvs[2] ) / this.atlasWidth, ( atlasOffset[1] + uvs[3] ) / this.atlasHeight,
            ( atlasOffset[0] + uvs[0] ) / this.atlasWidth, ( atlasOffset[1] + uvs[3] ) / this.atlasHeight,
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

    private stringifyBlockState(blockState: BlockState): string {
        const props = blockState.Properties;
        const stringifyProps = props == null ? '' : Object.entries(props).map(([ k, v ]) => `${ k }=${ v }`).join(',');
        return `${ blockState.Name }[${ stringifyProps }]`;
    }

    private variantMesh(block: BlockState, variant: BlockVariant): Object3D {
        if ( block.Name === 'air' || block.Name === 'void_air' || block.Name === 'cave_air' ) {
            return new Group();
        }

        const model = this.getFlattenedModel(variant.model);
        if ( !model.elements ) {
            throw Error(`Flattened model doesn't have elements tag. Cannot render: ${ this.stringifyBlockState(block) }`);
        }
        if ( !model.textures ) {
            throw Error(`Flattened model doesn't have textures. Cannot render: ${ this.stringifyBlockState(block) }`);
        }
        // Delete unnecessary stuff
        delete model.textures['particle'];
        delete model.display;
        delete model.gui_light;
        delete model.ambientocclusion;

        let blockGroup = new Group();
        blockGroup.position.addScalar(0.5);

        const dd = (fd: number, td: number) => ( fd + td - 1 ) / 2;

        for ( const elem of model.elements ) {
            const f = new Vector3().fromArray(elem.from).divideScalar(16);
            const t = new Vector3().fromArray(elem.to).divideScalar(16);

            const elementGroup = new Group();
            const elementOffset = new Vector3(dd(f.x, t.x), dd(f.y, t.y), dd(f.z, t.z));
            elementGroup.position.add(elementOffset);

            for ( const [ side, atts ] of Object.entries(elem.faces) ) {
                const face = cast<Face>(atts);
                const planeGeom = new PlaneGeometry(1, 1);
                const planeMesh = new Mesh(planeGeom, this.atlas);
                const uvs = this.getUVs(model, face, [ 0, 0, 16, 16 ]);
                planeGeom.setAttribute('uv', new Float32BufferAttribute(uvs, 2));

                const lutRes = AXIS_ROT_OFFSET_LUT[cast<Side>(side)];
                this.rotateOnPivot(planeMesh, Axis.Y, lutRes.yRot);
                this.rotateOnPivot(planeMesh, Axis.X, lutRes.xRot);
                this.rotateOnPivot(planeMesh, Axis.Z, face.rotation ?? 0);
                planeMesh.position.set(lutRes.xOffset, lutRes.yOffset, lutRes.zOffset);

                elementGroup.add(planeMesh);
            }

            const rot = elem.rotation;
            if ( rot != null ) {
                console.log(rot);
                const pivot = new Vector3().fromArray(rot.origin).divideScalar(16);
                this.rotateOnPivot(elementGroup, rot.axis, rot.angle, pivot);

                if ( rot.rescale ) {
                    const scaleVector = this.axisToScaleVector(rot.axis, rot.angle);
                    elementGroup.scale.multiply(scaleVector);
                }
            }

            blockGroup.add(elementGroup);
        }

        // Why does it need to be -ve angle? Don't ask. idk.
        if ( variant.y != null ) {
            this.rotateOnPivot(blockGroup, Axis.Y, -variant.y);
        }
        if ( variant.x != null ) {
            this.rotateOnPivot(blockGroup, Axis.X, -variant.x);
        }

        return blockGroup;
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
