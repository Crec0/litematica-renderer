export interface BlockModel {
    ambientocclusion?: boolean;
    display?: DisplayOverrides;
    elements?: Element[];
    groups?: Group[];
    gui_light?: GUILightType;
    overrides?: Override[];
    parent?: string;
    textures?: { [key: string]: string };
}

interface DisplayOverrides {
    firstperson_lefthand?: TransForms3D;
    firstperson_righthand?: TransForms3D;
    fixed?: TransForms3D;
    ground?: TransForms3D;
    gui?: TransForms3D;
    head?: TransForms3D;
    thirdperson_lefthand?: TransForms3D;
    thirdperson_righthand?: TransForms3D;
}

interface TransForms3D {
    rotation?: number[];
    scale?: number[];
    translation?: number[];
}

interface Element {
    from: number[];
    to: number[];
    faces: Faces;
    rotation?: Rotation;
    shade?: boolean;
    name?: string;
    __comment?: string;
}

interface Faces {
    down?: Down;
    up?: Down;
    north?: Down;
    south?: Down;
    west?: Down;
    east?: Down;
}

interface Down {
    uv?: number[];
    texture: string;
    cullface?: Direction;
    rotation?: number;
    tintindex?: number;
}

interface Group {
    name: Direction;
    origin: number[];
    color: number;
    children: number[];
}

interface Rotation {
    origin: number[];
    axis: Axis;
    angle: number;
    rescale?: boolean;
}

interface Override {
    predicate: { [key: string]: number };
    model: string;
}

export enum Direction {
    BOTTOM = "bottom",
    DOWN = "down",
    EAST = "east",
    NORTH = "north",
    SOUTH = "south",
    UP = "up",
    WEST = "west",
}

export enum Axis {
    X = "x",
    Y = "y",
    Z = "z",
}

export enum GUILightType {
    FRONT = "front",
    SIDE = "side",
}

