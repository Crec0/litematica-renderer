export interface Litematic {
    MinecraftDataVersion: number;
    Version: number;
    Metadata: Metadata;
    Regions: Record<string, Region>;
}

export interface Region {
    Size: BlockPos;
    Position: BlockPos;
    BlockStates: bigint[];
    BlockStatePalette: BlockStatePalette[];
    Entities: unknown;
    TileEntities: unknown;
    PendingBlockTicks: unknown;
    PendingFluidTicks: unknown;
}

export interface BlockStatePalette {
    Name: string;
    Properties?: Record<string, string>;
}

export interface Metadata {
    Name: string;
    Author: string;
    Description: string;
    RegionCount: number;
    TotalBlocks: number;
    TotalVolume: number;
    TimeCreated: bigint;
    TimeModified: bigint;
    EnclosingSize: BlockPos;
}

export interface BlockPos {
    x: number;
    y: number;
    z: number;
}