import { Tags } from './NbtUtil';


export class NbtReader {
    private readonly buffer: DataView;
    private offset: number;

    constructor(rawByteArray: Uint8Array) {
        this.buffer = new DataView(rawByteArray.buffer);
        this.offset = 0;
    }

    end(): number {
        throw Error('Invalid call');
    }

    byte(): number {
        const num = this.buffer.getInt8(this.offset);
        this.offset += 1;
        return num;
    }

    short(): number {
        const num = this.buffer.getInt16(this.offset);
        this.offset += 2;
        return num;
    }

    int(): number {
        const num = this.buffer.getInt32(this.offset);
        this.offset += 4;
        return num;
    }

    long() {
        const num = this.buffer.getBigInt64(this.offset);
        this.offset += 8;
        return num;
    }

    float() {
        const num = this.buffer.getFloat32(this.offset);
        this.offset += 4;
        return num;
    }

    double() {
        const num = this.buffer.getFloat64(this.offset);
        this.offset += 8;
        return num;
    }

    byteArray() {
        const array: number[] = [];
        const length = this.int();
        for ( let i = 0; i < length; i++ ) {
            array.push(this.byte());
        }
        return array;
    }

    intArray() {
        const array: number[] = [];
        const length = this.int();
        for ( let i = 0; i < length; i++ ) {
            array.push(this.int());
        }
        return array;
    }

    longArray() {
        const array: bigint[] = [];
        const length = this.int();
        for ( let i = 0; i < length; i++ ) {
            array.push(this.long());
        }
        return array;

    }

    string(): string {
        const length = this.short();
        const codepoints = [];

        for ( let i = 0; i < length; i++ ) {
            const firstByte = this.byte();
            if ( ( firstByte & 0x80 ) === 0x0 ) { // U+00
                codepoints.push(
                    firstByte & 0x7F,
                );
            } else if ( ( firstByte >>> 5 ) === 0x06 ) { // U+80
                codepoints.push(
                    firstByte & 0x1F,
                    this.byte() & 0x3f,
                );
                i += 1;
            } else if ( ( firstByte >>> 4 ) === 0x0E ) { // U+0800
                codepoints.push(
                    firstByte & 0x0F,
                    this.byte() & 0x3f,
                    this.byte() & 0x3f,
                );
                i += 2;
            } else if ( ( firstByte >>> 3 ) === 0x1E ) { // U+10000
                codepoints.push(
                    firstByte & 0x07,
                    this.byte() & 0x3f,
                    this.byte() & 0x3f,
                    this.byte() & 0x3f,
                );
                i += 3;
            }
        }
        return String.fromCharCode(...codepoints);
    }

    list(simplified: boolean = false): [] | {} {
        const func = Tags[this.byte()];
        const length = this.int();
        const data = [];
        for ( let i = 0; i < length; i++ ) {
            data.push(this[func as keyof NbtReader](simplified));
        }
        return simplified ? data : { type: func, value: data };
    }

    compound(simplified: boolean = false) {
        const data = {};
        while ( true ) {
            const func = Tags[this.byte()];
            if ( func === 'end' )
                break;

            if ( simplified ) {
                data[this.string()] = this[func as keyof NbtReader](simplified);
            } else {
                data[this.string()] = {
                    type: func,
                    value: this[func as keyof NbtReader](simplified),
                };
            }
        }

        return data;
    }

    read(simplified: boolean = false) {
        const firstByte = this.byte();

        if ( firstByte !== 0x0A ) {
            throw Error('Invalid NBT start. Must begin with 0x0A');
        }

        const nbt = {};

        if ( simplified ) {
            nbt[this.string()] = this.compound(simplified);
        } else {
            nbt[this.string()] = {
                type: 'compound',
                value: this.compound(simplified),
            };
        }

        return nbt;
    }
}