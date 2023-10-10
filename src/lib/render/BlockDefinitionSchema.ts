import { z } from 'zod';
import { Facing } from './BlockDefinition';


const VariantSchema = z.object({
    model: z.string(),
    weight: z.number().optional(),
    uvlock: z.boolean().optional(),
    y: z.number().optional(),
    x: z.number().optional(),
});

const FacingSchema = z.nativeEnum(Facing);

const OrSchema = z.object({
    north: z.string().optional(),
    east: z.string().optional(),
    south: z.string().optional(),
    up: z.string().optional(),
    west: z.string().optional(),
});

const AndSchema = z.object({
    facing: FacingSchema.optional(),
    slot_0_occupied: z.string().optional(),
    slot_1_occupied: z.string().optional(),
    slot_2_occupied: z.string().optional(),
    slot_3_occupied: z.string().optional(),
    slot_4_occupied: z.string().optional(),
    slot_5_occupied: z.string().optional(),
});

const WhenSchema = z.object({
    north: z.string().optional(),
    east: z.string().optional(),
    south: z.string().optional(),
    west: z.string().optional(),
    up: z.string().optional(),
    age: z.string().optional(),
    leaves: z.string().optional(),
    has_bottle_0: z.string().optional(),
    has_bottle_1: z.string().optional(),
    has_bottle_2: z.string().optional(),
    down: z.string().optional(),
    facing: FacingSchema.optional(),
    AND: z.array(AndSchema).optional(),
    level: z.string().optional(),
    OR: z.array(OrSchema).optional(),
    flower_amount: z.string().optional(),
});

const MultipartSchema = z.object({
    apply: z.union([ z.array(VariantSchema), VariantSchema ]),
    when: WhenSchema.optional(),
});

export const BlockDefinitionSchema = z.object({
    variants: z
        .record(z.union([ z.array(VariantSchema), VariantSchema ]))
        .optional(),
    multipart: z.array(MultipartSchema).optional(),
});

const blockDefinitionMap = z.map(z.string(), BlockDefinitionSchema);
export type BlockDefinitionMap = z.infer<typeof blockDefinitionMap>
