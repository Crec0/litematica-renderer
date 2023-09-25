import BlockDefinitionJson from "../../assets/block-definitions.json"
import BlockModelJson from "../../assets/block-models.json"
import type {BlockModelMap} from "./BlockModelSchema";
import {BlockModelSchema} from "./BlockModelSchema";
import type {BlockDefinitionMap} from "./BlockDefinitionSchema";
import {BlockDefinitionSchema} from "./BlockDefinitionSchema";

export class ResourceManager {
    private blockDefinitions: BlockDefinitionMap
    private blockModels: BlockModelMap

    constructor() {
        this.blockDefinitions = new Map();
        this.blockModels = new Map();
    }

    read(): void {
        Object.entries(BlockDefinitionJson).forEach(([name, value]: [string, unknown]) => {
            const parseResult = BlockDefinitionSchema.safeParse(value);
            if (parseResult.success === false) {
                console.log(parseResult.error)
            } else {
                this.blockDefinitions.set(name, parseResult.data)
            }
        })

        Object.entries(BlockModelJson).forEach(([name, value]: [string, unknown]) => {
            const parseResult = BlockModelSchema.safeParse(value);
            if (parseResult.success === false) {
                console.log(parseResult.error)
            } else {
                this.blockModels.set(name, parseResult.data)
            }
        })
    }
}