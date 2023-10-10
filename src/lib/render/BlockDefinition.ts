export interface BlockDefinition {
    variants?: { [key: string]: Variant[] | Variant };
    multipart?: Multipart[];
}


export interface Multipart {
    apply: Variant[] | Variant;
    when?: When;
}


export interface Variant {
    model: string;
    weight?: number;
    uvlock?: boolean;
    y?: number;
    x?: number;
}


export interface When {
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
    AND?: And[]; // Only used for chiseled bookshelves apparently
    level?: string;
    OR?: Or[];
    flower_amount?: string;
}


export interface And {
    facing?: Facing;
    slot_0_occupied?: string;
    slot_1_occupied?: string;
    slot_2_occupied?: string;
    slot_3_occupied?: string;
    slot_4_occupied?: string;
    slot_5_occupied?: string;
}


export enum Facing {
    East = 'east',
    North = 'north',
    South = 'south',
    West = 'west',
}


export interface Or {
    north?: string;
    east?: string;
    south?: string;
    up?: string;
    west?: string;
}
