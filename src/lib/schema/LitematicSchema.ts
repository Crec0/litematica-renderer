import { z } from 'zod';


export interface BlockStatePalette {
    Name: string;
    Properties?: { [key: string]: string };
}


export const blockStatePaletteSchema = z.object({
    Name: z.string(),
    Properties: z.record(z.string()).optional(),
});


export interface Vector3 {
    x: number;
    y: number;
    z: number;
}


export const vector3Schema = z.object({
    x: z.number(),
    y: z.number(),
    z: z.number(),
});


export interface Region {
    BlockStates: string[];
    PendingBlockTicks: any[];
    Position: Vector3;
    BlockStatePalette: BlockStatePalette[];
    Size: Vector3;
    PendingFluidTicks: any[];
    TileEntities: any[];
    Entities: any[];
}


export const regionSchema = z.object({
    BlockStates: z.array(z.string()),
    PendingBlockTicks: z.array(z.any()),
    Position: vector3Schema,
    BlockStatePalette: z.array(blockStatePaletteSchema),
    Size: vector3Schema,
    PendingFluidTicks: z.array(z.any()),
    TileEntities: z.array(z.any()),
    Entities: z.array(z.any()),
});


export interface Metadata {
    TimeCreated: string;
    TimeModified: string;
    EnclosingSize: Vector3;
    Description: string;
    RegionCount: number;
    TotalBlocks: number;
    Author: string;
    TotalVolume: number;
    Name: string;
}


export const metadataSchema = z.object({
    TimeCreated: z.string(),
    TimeModified: z.string(),
    EnclosingSize: vector3Schema,
    Description: z.string(),
    RegionCount: z.number(),
    TotalBlocks: z.number(),
    Author: z.string(),
    TotalVolume: z.number(),
    Name: z.string(),
});


export interface Litematic {
    MinecraftDataVersion: number;
    Version: number;
    Metadata: Metadata;
    Regions: { [key: string]: Region };
}


export const litematicSchema = z.object({
    MinecraftDataVersion: z.number(),
    Version: z.number(),
    Metadata: metadataSchema,
    Regions: z.record(regionSchema),
});
