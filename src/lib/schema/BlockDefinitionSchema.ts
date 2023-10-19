// noinspection JSUnusedGlobalSymbols

import { z } from 'zod';


export interface BlockVariant {
    model: string;
    weight?: number;
    uvlock?: boolean;
    y?: number;
    x?: number;
}


export const blockVariantSchema = z.object({
    model: z.string(),
    weight: z.number().optional(),
    uvlock: z.boolean().optional(),
    y: z.number().optional(),
    x: z.number().optional(),
});


export enum Facing {
    East = 'east',
    North = 'north',
    South = 'south',
    West = 'west',
}


export const facingSchema = z.nativeEnum(Facing);


export interface Or {
    north?: string;
    east?: string;
    south?: string;
    up?: string;
    west?: string;
}


export const orSchema = z.object({
    north: z.string().optional(),
    east: z.string().optional(),
    south: z.string().optional(),
    up: z.string().optional(),
    west: z.string().optional(),
});


export interface And {
    facing?: Facing;
    slot_3_occupied?: string;
    slot_1_occupied?: string;
    slot_2_occupied?: string;
    slot_4_occupied?: string;
    slot_0_occupied?: string;
    slot_5_occupied?: string;
}


export const andSchema = z.object({
    facing: facingSchema.optional(),
    slot_3_occupied: z.string().optional(),
    slot_1_occupied: z.string().optional(),
    slot_2_occupied: z.string().optional(),
    slot_4_occupied: z.string().optional(),
    slot_0_occupied: z.string().optional(),
    slot_5_occupied: z.string().optional(),
});


export interface MultiPartCondition {
    north?: string;
    east?: string;
    south?: string;
    west?: string;
    up?: string;
    age?: string;
    leaves?: string;
    has_bottle_0?: string;
    has_bottle_1?: string;
    has_bottle_2?: string;
    down?: string;
    facing?: Facing;
    AND?: And[];
    level?: string;
    OR?: Or[];
    flower_amount?: string;
}


export const multiPartConditionSchema = z.object({
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
    facing: facingSchema.optional(),
    AND: z.array(andSchema).optional(),
    level: z.string().optional(),
    OR: z.array(orSchema).optional(),
    flower_amount: z.string().optional(),
});


export interface Multipart {
    apply: BlockVariant[] | BlockVariant;
    when?: MultiPartCondition;
}


export const multipartSchema = z.object({
    apply: z.union([ z.array(blockVariantSchema), blockVariantSchema ]),
    when: multiPartConditionSchema.optional(),
});


export interface BlockDefinition {
    variants?: { [key: string]: BlockVariant[] | BlockVariant };
    multipart?: Multipart[];
}


export const blockDefinionSchema = z.object({
    variants: z
        .record(z.union([ z.array(blockVariantSchema), blockVariantSchema ]))
        .optional(),
    multipart: z.array(multipartSchema).optional(),
});
