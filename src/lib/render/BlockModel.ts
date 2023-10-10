export interface BlockModel {
    ambientocclusion?: boolean;
    display?: DisplayOverrides;
    elements?: Quad[];
    groups?: Group[];
    gui_light?: GUILightType;
    overrides?: Override[];
    parent?: string;
    textures?: Record<string, string>;
}


export interface DisplayOverrides {
    firstperson_lefthand?: Transform3D;
    firstperson_righthand?: Transform3D;
    fixed?: Transform3D;
    ground?: Transform3D;
    gui?: Transform3D;
    head?: Transform3D;
    thirdperson_lefthand?: Transform3D;
    thirdperson_righthand?: Transform3D;
}


export interface Transform3D {
    rotation?: number[];
    scale?: number[];
    translation?: number[];
}


export interface Quad {
    from: number[];
    to: number[];
    faces: Faces;
    rotation?: Rotation;
    shade?: boolean;
    name?: string;
    __comment?: string;
}


export interface Faces {
    down?: Face;
    up?: Face;
    north?: Face;
    south?: Face;
    west?: Face;
    east?: Face;
}


export interface Face {
    uv?: number[];
    texture: string;
    cullface?: FaceFacingDirection;
    rotation?: number;
    tintindex?: number;
}


export interface Group {
    name: FaceFacingDirection;
    origin: number[];
    color: number;
    children: number[];
}


export interface Rotation {
    origin: number[];
    axis: Axis;
    angle: number;
    rescale?: boolean;
}


export interface Override {
    predicate: Record<string, number>;
    model: string;
}


export enum FaceFacingDirection {
    BOTTOM = 'bottom',
    DOWN = 'down',
    EAST = 'east',
    NORTH = 'north',
    SOUTH = 'south',
    UP = 'up',
    WEST = 'west',
}


export enum Axis {
    X = 'x',
    Y = 'y',
    Z = 'z',
}


export enum GUILightType {
    FRONT = 'front',
    SIDE = 'side',
}
