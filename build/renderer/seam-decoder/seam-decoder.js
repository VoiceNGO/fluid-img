// .seam spec:
// -----------
// ('SEAM'+seams)[]
// seams spec:
// -----------
// version: 1 byte
// stepSize - 1: 4 bits
// mergeSize - 1: 2 bits
// isVertical: 1 bit
// isCompressed: 1 bit
// imageWidth: 2 bytes
// imageHeight: 2 bytes
// numSeams: 2 bytes
// individualSeams[]
// individual seam spec:
// ---------------------
// starting col or row: 2 bytes
// direction for each step of seam: 1 or 2 bits.  In compressed mode 0=left/down, 1=right/up.  In uncompresed mode 00=left/down, 01=straight, 01=right/up
// horizontal seams are stored as vertical seams, rotated 90º CCW before being saved, and are un-rotated after decompression
const ERROR_MESSAGES = {
    invalidMagicBytes: (offset, expected, got) => `Invalid magic bytes at offset ${offset}. Expected '${expected}', got '${got}'`,
    unexpectedEndOfBuffer: 'Unexpected end of buffer',
    unexpectedEndOfBufferDirection: 'Unexpected end of buffer while reading direction data',
    invalidDirectionBits: (bits) => `Invalid direction bits: ${bits}`,
    fetchFailed: (url, status) => `Failed to fetch ${url}: ${status}`,
    invalidInput: 'Input must be a string (base64) or URL',
};
export var Direction;
(function (Direction) {
    Direction[Direction["LEFT_DOWN"] = 0] = "LEFT_DOWN";
    Direction[Direction["STRAIGHT"] = 1] = "STRAIGHT";
    Direction[Direction["RIGHT_UP"] = 2] = "RIGHT_UP";
})(Direction || (Direction = {}));
export class SeamDecoder {
    buffer;
    offset = 0;
    constructor(input) {
        this.buffer = Buffer.from(input, 'binary');
    }
    static async fromURL(url) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(ERROR_MESSAGES.fetchFailed(url, response.status));
        }
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const decoder = new SeamDecoder('');
        decoder.buffer = buffer;
        return decoder;
    }
    decode() {
        const results = [];
        this.offset = 0;
        while (this.offset < this.buffer.length) {
            // Check for 'SEAM' magic bytes
            if (this.offset + 4 > this.buffer.length) {
                break;
            }
            const magic = this.buffer.toString('ascii', this.offset, this.offset + 4);
            if (magic !== 'SEAM') {
                throw new Error(ERROR_MESSAGES.invalidMagicBytes(this.offset, 'SEAM', magic));
            }
            this.offset += 4;
            const seamData = this.decodeSeamsBlock();
            results.push(seamData);
        }
        return results;
    }
    decodeSeamsBlock() {
        // Read version (1 byte)
        const version = this.readUInt8();
        // Read the packed byte containing stepSize, mergeSize, isVertical, isCompressed
        const packedByte = this.readUInt8();
        const stepSize = ((packedByte >> 4) & 0x0f) + 1; // 4 bits, add 1
        const mergeSize = ((packedByte >> 2) & 0x03) + 1; // 2 bits, add 1
        const isVertical = ((packedByte >> 1) & 0x01) === 1; // 1 bit
        const isCompressed = (packedByte & 0x01) === 1; // 1 bit
        // Read image dimensions (2 bytes each)
        const imageWidth = this.readUInt16BE();
        const imageHeight = this.readUInt16BE();
        // Read number of seams (2 bytes)
        const numSeams = this.readUInt16BE();
        // Read individual seams
        const seams = [];
        for (let i = 0; i < numSeams; i++) {
            const seam = this.decodeIndividualSeam(isCompressed, stepSize, isVertical, imageWidth, imageHeight);
            seams.push(seam);
        }
        return {
            version,
            stepSize,
            mergeSize,
            isVertical,
            isCompressed,
            imageWidth,
            imageHeight,
            numSeams,
            seams,
        };
    }
    decodeIndividualSeam(isCompressed, stepSize, isVertical, imageWidth, imageHeight) {
        // Read starting position (2 bytes)
        const startingPosition = this.readUInt16BE();
        // Calculate seam length
        const seamLength = isVertical ? imageHeight : imageWidth;
        const numSteps = Math.ceil((seamLength - 1) / stepSize);
        // Read direction data
        const directions = [];
        if (isCompressed) {
            // 1 bit per direction
            const numBytes = Math.ceil(numSteps / 8);
            for (let byteIdx = 0; byteIdx < numBytes; byteIdx++) {
                const byte = this.readUInt8();
                for (let bitIdx = 0; bitIdx < 8 && byteIdx * 8 + bitIdx < numSteps; bitIdx++) {
                    const bit = (byte >> (7 - bitIdx)) & 1;
                    directions.push(bit === 0 ? Direction.LEFT_DOWN : Direction.RIGHT_UP);
                }
            }
        }
        else {
            // 2 bits per direction
            let bitBuffer = 0;
            let bitsAvailable = 0;
            for (let stepIdx = 0; stepIdx < numSteps; stepIdx++) {
                // Ensure we have at least 2 bits available
                while (bitsAvailable < 2) {
                    if (this.offset >= this.buffer.length) {
                        throw new Error(ERROR_MESSAGES.unexpectedEndOfBufferDirection);
                    }
                    bitBuffer = (bitBuffer << 8) | this.readUInt8();
                    bitsAvailable += 8;
                }
                // Extract 2 bits
                const directionBits = (bitBuffer >> (bitsAvailable - 2)) & 0x03;
                bitsAvailable -= 2;
                // Convert to direction
                let direction;
                switch (directionBits) {
                    case 0:
                        direction = Direction.LEFT_DOWN;
                        break;
                    case 1:
                        direction = Direction.STRAIGHT;
                        break;
                    case 2:
                        direction = Direction.RIGHT_UP;
                        break;
                    default:
                        throw new Error(ERROR_MESSAGES.invalidDirectionBits(directionBits));
                }
                directions.push(direction);
            }
        }
        return {
            startingPosition,
            directions,
        };
    }
    readUInt8() {
        if (this.offset >= this.buffer.length) {
            throw new Error(ERROR_MESSAGES.unexpectedEndOfBuffer);
        }
        return this.buffer.readUInt8(this.offset++);
    }
    readUInt16BE() {
        if (this.offset + 1 >= this.buffer.length) {
            throw new Error(ERROR_MESSAGES.unexpectedEndOfBuffer);
        }
        const value = this.buffer.readUInt16BE(this.offset);
        this.offset += 2;
        return value;
    }
}
// Helper functions for easy usage
export function decodeSeamString(binaryString) {
    const decoder = new SeamDecoder(binaryString);
    return decoder.decode();
}
export async function decodeSeamURL(url) {
    const decoder = await SeamDecoder.fromURL(url);
    return decoder.decode();
}
