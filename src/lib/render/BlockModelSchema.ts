import {z} from "zod";
import {Axis, Direction, GUILightType} from "./BlockModel";
import {BlockDefinitionSchema} from "./BlockDefinitionSchema";
import {expoOut} from "svelte/easing";

const AxisSchema = z.nativeEnum(Axis)
const DirectionSchema = z.nativeEnum(Direction)
const GUILightSchema = z.nativeEnum(GUILightType)

const GroupSchema = z.object({
    name: DirectionSchema,
    origin: z.array(z.number()),
    color: z.number(),
    children: z.array(z.number())
})

const ItemOverrideSchema = z.object({
    predicate: z.record(z.number()),
    model: z.string()
})

const TransForms3DSchema = z.object({
    rotation: z.array(z.number()).optional(),
    scale: z.array(z.number()).optional(),
    translation: z.array(z.number()).optional()
})

const DisplayOverrideSchema = z.object({
    firstperson_lefthand: TransForms3DSchema.optional(),
    firstperson_righthand: TransForms3DSchema.optional(),
    fixed: TransForms3DSchema.optional(),
    ground: TransForms3DSchema.optional(),
    gui: TransForms3DSchema.optional(),
    head: TransForms3DSchema.optional(),
    thirdperson_lefthand: TransForms3DSchema.optional(),
    thirdperson_righthand: TransForms3DSchema.optional()
})

const FaceSchema = z.object({
    uv: z.array(z.number()).optional(),
    texture: z.string(),
    cullface: DirectionSchema.optional(),
    rotation: z.number().optional().default(0),
    tintindex: z.number().optional()
})

const RotationSchema = z.object({
    origin: z.array(z.number()),
    axis: AxisSchema,
    angle: z.number(),
    rescale: z.boolean().optional().default(false)
})

const FacesSchema = z.object({
    down: FaceSchema.optional(),
    up: FaceSchema.optional(),
    north: FaceSchema.optional(),
    south: FaceSchema.optional(),
    west: FaceSchema.optional(),
    east: FaceSchema.optional()
})

const ElementSchema = z.object({
    from: z.array(z.number()),
    to: z.array(z.number()),
    faces: FacesSchema,
    rotation: RotationSchema.optional(),
    shade: z.boolean().optional().default(true),
    name: z.string().optional(),
    __comment: z.string().optional()
})

export const BlockModelSchema = z.object({
    ambientocclusion: z.boolean().optional().default(true),
    display: DisplayOverrideSchema.optional(),
    elements: z.array(ElementSchema).optional(),
    groups: z.array(GroupSchema).optional(),
    gui_light: GUILightSchema.optional().default(GUILightType.SIDE),
    overrides: z.array(ItemOverrideSchema).optional(),
    parent: z.string().optional(),
    textures: z.record(z.string()).optional()
})

const blockModelMap = z.map(z.string(), BlockModelSchema);
export type BlockModelMap = z.infer<typeof blockModelMap>
