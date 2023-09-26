import BlockDefinitionJson from "../../assets/block-definitions.json"
import BlockModelJson from "../../assets/block-models.json"
import type {BlockModelMap} from "./BlockModelSchema";
import {BlockModelSchema} from "./BlockModelSchema";
import type {BlockDefinitionMap} from "./BlockDefinitionSchema";
import {BlockDefinitionSchema} from "./BlockDefinitionSchema";
import type {Variant} from "./BlockDefinition";
import * as THREE from 'three'
import type {BlockModel} from "./BlockModel";

export class ResourceManager {
    private blockDefinitions: BlockDefinitionMap = new Map();
    private blockModels: BlockModelMap = new Map();
    private textureLoader = new THREE.TextureLoader().setPath("src/assets/textures")
    private textureCache = new WeakMap<String, THREE.Texture>()
    private meshes = new Array<THREE.Mesh>()

    load(): void {
        Object.entries(BlockDefinitionJson).forEach(([name, value]: [string, unknown]) => {
            const parseResult = BlockDefinitionSchema.safeParse(value);
            if (parseResult.success) {
                this.blockDefinitions.set(name, parseResult.data)
            } else {
                console.log("Failed to load definition:", name)
            }
        })

        Object.entries(BlockModelJson).forEach(([name, value]: [string, unknown]) => {
            const parseResult = BlockModelSchema.safeParse(value);
            if (parseResult.success) {
                this.blockModels.set(name, parseResult.data)
            } else {
                console.log("Failed to load definition:", name)
            }
        })
    }

    getModel(name: string): BlockModel {
        const model = this.blockModels.get(name.replace("minecraft:", ""));
        if (model) {
            return structuredClone(model);
        }
        throw Error(`Model doesn't exist: ${name}`)
    }

    private getFlattenedModel(name: string): BlockModel {
        const model = this.getModel(name);
        if (model.parent) {
            const parent = this.getFlattenedModel(model.parent);
            delete model.parent
            return Object.assign(parent, model);
        }
        return model;
    }

    private variantMesh(variantName: string, variant: Variant) {
        const model = this.getFlattenedModel(variant.model)
        // TODO: More

    }

    generateMeshes(meshName: string = "candle") {
        const stoneDefinition = this.blockDefinitions.get(meshName)
        if (!stoneDefinition?.variants)  {
            console.log(`${meshName} is not present in the model map.`)
            return;
        }

        Object.entries(stoneDefinition.variants).forEach(([variantName, variations]) => {
            if (variations instanceof Array) {
                Object.values(variations).forEach(v => this.variantMesh(variantName, v))
            } else {
                this.variantMesh(variantName, variations)
            }
        })
    }
}