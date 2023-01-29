import {Tags} from "./NbtUtil";

export class NbtReader {
    private readonly buffer: DataView;
    private offset: number;

    constructor(rawByteArray: Uint8Array) {
        this.buffer = new DataView(rawByteArray.buffer);
        this.offset = 0;
    }

    end() {
        throw Error('Invalid call')
    }

    byte() {
        const num = this.buffer.getInt8(this.offset);
        this.offset += 1;
        return num
    }

    short() {
        const num = this.buffer.getInt16(this.offset);
        this.offset += 2;
        return num
    }

    int() {
        const num = this.buffer.getInt32(this.offset);
        this.offset += 4;
        return num
    }

    long() {
        return [this.int(), this.int()]
    }

    float() {
        const num = this.buffer.getFloat32(this.offset);
        this.offset += 4;
        return num
    }

    double() {
        return [this.float(), this.float()]
    }

    byteArray() {
        const array: number[] = [];
        const length = this.int()
        for (let i = 0; i < length; i++) {
            array.push(this.byte())
        }
        return array;
    }

    intArray() {
        const array: number[] = [];
        const length = this.int()
        for (let i = 0; i < length; i++) {
            array.push(this.int())
        }
        return array;
    }

    longArray() {
        const array: number[][] = [];
        const length = this.int()
        for (let i = 0; i < length; i++) {
            array.push(this.long())
        }
        return array;

    }

    string(): string {
        const length = this.short();
        const codepoints = [];

        for (let i = 0; i < length; i++) {
            const firstByte = this.byte()
            if ((firstByte & 0x80) === 0x0) { // U+00
                codepoints.push(
                    firstByte & 0x7F
                )
            } else if ((firstByte >>> 5) === 0x06) { // U+80
                codepoints.push(
                    firstByte & 0x1F,
                    this.byte() & 0x3f,
                )
                i += 1;
            } else if ((firstByte >>> 4) === 0x0E) { // U+0800
                codepoints.push(
                    firstByte & 0x0F,
                    this.byte() & 0x3f,
                    this.byte() & 0x3f,
                )
                i += 2;
            } else if ((firstByte >>> 3) === 0x1E) { // U+10000
                codepoints.push(
                    firstByte & 0x07,
                    this.byte() & 0x3f,
                    this.byte() & 0x3f,
                    this.byte() & 0x3f,
                )
                i += 3;
            }
        }
        return String.fromCharCode(...codepoints)
    }

    list() {
        const func = Tags[this.byte()];
        const length = this.int();
        const data = [];
        for (let i = 0; i < length; i++) {
            data.push(this[func as keyof NbtReader]())
        }
        return {type: func, value: data};
    }

    compound() {
        const data = {};
        while (true) {
            const func = Tags[this.byte()];
            if (func === 'end')
                break;

            data[this.string()] = {
                type: func,
                value: this[func as keyof NbtReader]()
            };
        }

        return data;
    }

    read() {
        const firstByte = this.byte()

        if (firstByte !== 0x0A) {
            throw Error('Invalid NBT start. Must begin with 0x0A')
        }

        const nbt = {};

        nbt[this.string()] = {
            type: 'compound',
            value: this.compound()
        };

        return nbt;
    }
}