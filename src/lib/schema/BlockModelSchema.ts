// noinspection JSUnusedGlobalSymbols

import { z } from 'zod';


export enum GUILight {
    Front = 'front',
    Side = 'side',
}


export interface Override {
    predicate: Record<string, number>;
    model: string;
}


export interface Transforms3D {
    rotation?: number[];
    translation?: number[];
    scale?: number[];
}


export const transforms3DSchema = z.object({
    rotation: z.array(z.number()).optional(),
    translation: z.array(z.number()).optional(),
    scale: z.array(z.number()).optional(),
});


export enum FaceName {
    Bottom = 'bottom',
    Down = 'down',
    East = 'east',
    North = 'north',
    South = 'south',
    Up = 'up',
    West = 'west',
}


export const faceNameSchema = z.nativeEnum(FaceName);


export enum Axis {
    X = 'x',
    Y = 'y',
    Z = 'z',
}


export const axisSchema = z.nativeEnum(Axis);


export interface Group {
    name: FaceName;
    origin: number[];
    color: number;
    children: number[];
}


export const groupSchema = z.object({
    name: faceNameSchema,
    origin: z.array(z.number()),
    color: z.number(),
    children: z.array(z.number()),
});

export const gUILightSchema = z.nativeEnum(GUILight);

export const overrideSchema = z.object({
    predicate: z.record(z.number()),
    model: z.string(),
});


export interface DisplayTransforms {
    gui?: Transforms3D;
    ground?: Transforms3D;
    fixed?: Transforms3D;
    thirdperson_righthand?: Transforms3D;
    firstperson_righthand?: Transforms3D;
    firstperson_lefthand?: Transforms3D;
    head?: Transforms3D;
    thirdperson_lefthand?: Transforms3D;
}


export const displayTransformsSchema = z.object({
    gui: transforms3DSchema.optional(),
    ground: transforms3DSchema.optional(),
    fixed: transforms3DSchema.optional(),
    thirdperson_righthand: transforms3DSchema.optional(),
    firstperson_righthand: transforms3DSchema.optional(),
    firstperson_lefthand: transforms3DSchema.optional(),
    head: transforms3DSchema.optional(),
    thirdperson_lefthand: transforms3DSchema.optional(),
});


export interface Face {
    uv?: number[];
    texture: string;
    cullface?: FaceName;
    rotation?: number;
    tintindex?: number;
}


export const faceSchema = z.object({
    uv: z.array(z.number()).optional(),
    texture: z.string(),
    cullface: faceNameSchema.optional(),
    rotation: z.number().optional(),
    tintindex: z.number().optional(),
});


export interface Rotation {
    origin: number[];
    axis: Axis;
    angle: number;
    rescale?: boolean;
}


export const rotationSchema = z.object({
    origin: z.array(z.number()),
    axis: axisSchema,
    angle: z.number(),
    rescale: z.boolean().optional(),
});


export interface Faces {
    down?: Face;
    up?: Face;
    north?: Face;
    south?: Face;
    west?: Face;
    east?: Face;
}


export const facesSchema = z.object({
    down: faceSchema.optional(),
    up: faceSchema.optional(),
    north: faceSchema.optional(),
    south: faceSchema.optional(),
    west: faceSchema.optional(),
    east: faceSchema.optional(),
});


export interface Element {
    from: number[];
    to: number[];
    faces: Faces;
    shade?: boolean;
    __comment?: string;
    rotation?: Rotation;
    name?: string;
}


export const elementSchema = z.object({
    from: z.array(z.number()),
    to: z.array(z.number()),
    faces: facesSchema,
    shade: z.boolean().optional(),
    __comment: z.string().optional(),
    rotation: rotationSchema.optional(),
    name: z.string().optional(),
});


export interface BlockModel {
    parent?: string;
    textures?: Record<string, string>;
    elements?: Element[];
    ambientocclusion?: boolean;
    gui_light?: GUILight;
    display?: DisplayTransforms;
    groups?: Group[];
    overrides?: Override[];
}


export const blockModelSchema = z.object({
    parent: z.string().optional(),
    textures: z.record(z.string()).optional(),
    elements: z.array(elementSchema).optional(),
    ambientocclusion: z.boolean().optional(),
    gui_light: gUILightSchema.optional(),
    display: displayTransformsSchema.optional(),
    groups: z.array(groupSchema).optional(),
    overrides: z.array(overrideSchema).optional(),
});
