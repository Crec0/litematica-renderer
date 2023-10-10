import { Tags } from './NbtUtil';


export class NbtWriter {
    private readonly nbt;
    private buffer: Uint8Array;
    private intermediateFloatBuffer: Uint8Array;
    private float32Buffer: Float32Array;
    private float64Buffer: Float64Array;
    private offset: number;

    constructor(nbt) {
        this.nbt = nbt;
        this.offset = 0;
        this.buffer = new Uint8Array(1024);

        this.intermediateFloatBuffer = new Uint8Array(8);
        this.float32Buffer = new Float32Array(this.intermediateFloatBuffer);
        this.float64Buffer = new Float64Array(this.intermediateFloatBuffer);
    }

    private expandBufferIfRequired(size: number) {
        const length = this.buffer.length;
        if ( this.offset + size < length ) {
            return;
        }
        const newBuffer = new Uint8Array(length * 2);
        for ( let i = 0; i < length; i++ ) {
            newBuffer[i] = this.buffer[i];
        }
        this.buffer = newBuffer;
    }

    private trimToSize(): Uint8Array {
        return new Uint8Array(this.buffer.slice(0, this.offset - 1));
    }

    byte(number: number) {
        this.expandBufferIfRequired(1);
        this.buffer[this.offset] = number;
        this.offset += 1;
    }

    short(number: number) {
        this.byte(number & 0xFF);
        this.byte(( number >> 8 ) & 0xFF);
    }

    int(number: number) {
        this.short(number & 0xFFFF);
        this.short(( number >> 16 ) & 0xFFFF);
    }

    long(number: [ number, number ]) {
        this.int(number[0]);
        this.int(number[1]);
    }

    float(number: number) {
        this.expandBufferIfRequired(4);
        this.float32Buffer[0] = number;
        for ( let i = 0; i < 4; i++ ) {
            this.byteArray[this.offset + i] = this.intermediateFloatBuffer[i];
        }
        this.offset += 4;
    }

    double(number: [ number, number ]) {
        this.float(number[0]);
        this.float(number[1]);
    }

    byteArray(array) {
        this.int(array.length);
        for ( const number of array ) {
            this.byte(number);
        }
    }

    intArray(array) {
        this.int(array.length);
        for ( const number of array ) {
            this.int(number);
        }
    }

    longArray(array) {
        this.int(array.length);
        for ( const number of array ) {
            this.long(number);
        }
    }

    string(str) {
        this.short(str.length);
        for ( const char of str ) {
            const cp = char.codePointAt(0) as number;
            if ( cp < 0x80 ) {

                this.byte(cp >> 0x00 & 0x7F | 0x00);

            } else if ( cp < 0x0800 ) {

                this.byte(cp >> 0x06 & 0x1F | 0xC0);
                this.byte(cp >> 0x00 & 0x3F | 0x80);

            } else if ( cp < 0x010000 ) {

                this.byte(cp >> 0x0C & 0x0F | 0xE0);
                this.byte(cp >> 0x06 & 0x3F | 0x80);
                this.byte(cp >> 0x00 & 0x3F | 0x80);

            } else if ( cp < 0x110000 ) {

                this.byte(cp >> 0x13 & 0x07 | 0xF0);
                this.byte(cp >> 0x0C & 0x3F | 0x80);
                this.byte(cp >> 0x06 & 0x3F | 0x80);
                this.byte(cp >> 0x00 & 0x3F | 0x80);

            }
        }
    }

    list(lst) {
        const func = Tags.indexOf(lst.type);
        this.byte(func);
        this.int(lst.value.length);
        for ( const val of lst.value ) {
            // @ts-ignore
            this[lst.type](val);
        }
    }

    compound(nbt) {
        for ( const [ key, val ] of Object.entries(nbt) ) {
            // @ts-ignore
            this.byte(Tags.indexOf(val.type));
            this.string(key);
            // @ts-ignore
            this[val.type](val.value);
        }
        this.byte(0x00);
    }

    write(): Uint8Array {
        this.compound(this.nbt);
        return this.trimToSize();
    }
}