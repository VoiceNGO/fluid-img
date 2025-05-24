/* Represents a 2D matrix in a 1D array */
type MatrixConstructors =
  | Int8ArrayConstructor
  | Int16ArrayConstructor
  | Int32ArrayConstructor
  | Uint8ArrayConstructor
  | Uint16ArrayConstructor
  | Uint32ArrayConstructor
  | Float32ArrayConstructor
  | Float64ArrayConstructor;
type MatrixTypes = InstanceType<MatrixConstructors>;

const ErrorMessages = {
  NO_OP: 'Told to rotate a matrix by 0 degrees, but that is a no-op.  Please verify your input',
  ONLY_90_DEGREES: 'Only 90-degree increments are supported',
  NON_SQUARE_MATRIX: 'Cannot rotate non-square matrix in-place for 90°/270° rotations',
  NOT_PERFECT_SQUARE:
    'Array length must be a perfect square when width and height are not provided',
};

export class Matrix<ArrayConstructor extends MatrixConstructors = Int8ArrayConstructor> {
  #width: number;
  #height: number;
  #matrix: MatrixTypes;

  // Overload signatures
  constructor(data: number[] | MatrixTypes);
  constructor(
    data: number[] | MatrixTypes,
    width: number,
    height: number,
    ArrayConstructor?: ArrayConstructor
  );

  // Implementation
  constructor(
    data: number[] | MatrixTypes,
    width?: number,
    height?: number,
    // @ts-expect-error - blah blah blah, inferred generics, blah blah blah
    ArrayConstructor: ArrayConstructor = Int8Array
  ) {
    if (width === undefined || height === undefined) {
      // Handle the case where only data is provided
      const length = data.length;
      const size = Math.sqrt(length);

      if (!Number.isInteger(size)) {
        throw new Error(ErrorMessages.NOT_PERFECT_SQUARE);
      }

      this.#width = size;
      this.#height = size;
    } else {
      this.#width = width;
      this.#height = height;
    }

    this.#matrix = new ArrayConstructor(this.#width * this.#height);
    this.#matrix.set(data);
  }

  get width(): number {
    return this.#width;
  }

  get height(): number {
    return this.#height;
  }

  get matrix():
    | Int8Array
    | Int16Array
    | Int32Array
    | Uint8Array
    | Uint16Array
    | Uint32Array
    | Float32Array
    | Float64Array {
    return this.#matrix;
  }

  #rotateImpl(degrees: number, inPlace: boolean) {
    degrees = ((degrees % 360) + 360) % 360;

    if (degrees % 90 !== 0) {
      throw new Error(ErrorMessages.ONLY_90_DEGREES);
    }

    if (degrees === 0) {
      throw new Error(ErrorMessages.NO_OP);
    }

    if (inPlace) {
      return this.#rotateInPlace(degrees);
    } else {
      const { matrix, width, height } = this.#rotate(degrees);
      return new Matrix(matrix, width, height, this.#matrix.constructor as ArrayConstructor);
    }
  }

  #rotateInPlace(degrees: number) {
    if (degrees === 180) {
      const length = this.#matrix.length;
      for (let i = 0; i < length / 2; i++) {
        const temp = this.#matrix[i]!;
        this.#matrix[i] = this.#matrix[length - 1 - i]!;
        this.#matrix[length - 1 - i] = temp;
      }
      return this;
    } else if (this.#width === this.#height) {
      const n = this.#width;

      // Rotate layer by layer
      for (let layer = 0; layer < Math.floor(n / 2); layer++) {
        const first = layer;
        const last = n - 1 - layer;

        for (let i = first; i < last; i++) {
          const offset = i - first;

          // Save top element
          const topIndex = first * n + i;
          const top = this.#matrix[topIndex]!;

          if (degrees === 90) {
            // 90° clockwise
            // top = left
            this.#matrix[topIndex] = this.#matrix[(last - offset) * n + first]!;
            // left = bottom
            this.#matrix[(last - offset) * n + first] = this.#matrix[last * n + (last - offset)]!;
            // bottom = right
            this.#matrix[last * n + (last - offset)] = this.#matrix[i * n + last]!;
            // right = top
            this.#matrix[i * n + last] = top;
          } else {
            // 270°
            // 270° clockwise (90° counter-clockwise)
            // top = right
            this.#matrix[topIndex] = this.#matrix[i * n + last]!;
            // right = bottom
            this.#matrix[i * n + last] = this.#matrix[last * n + (last - offset)]!;
            // bottom = left
            this.#matrix[last * n + (last - offset)] = this.#matrix[(last - offset) * n + first]!;
            // left = top
            this.#matrix[(last - offset) * n + first] = top;
          }
        }
      }
      return this;
    } else {
      throw new Error(ErrorMessages.NON_SQUARE_MATRIX);
    }
  }

  #rotate(degrees: number) {
    let newWidth = this.#width;
    let newHeight = this.#height;

    if (degrees === 90 || degrees === 270) {
      newWidth = this.#height;
      newHeight = this.#width;
    }

    const newMatrix = new (this.#matrix.constructor as any)(newWidth * newHeight);

    for (let y = 0; y < this.#height; y++) {
      for (let x = 0; x < this.#width; x++) {
        const oldIndex = y * this.#width + x;
        let newX: number, newY: number;

        switch (degrees) {
          case 90: // 90 degrees clockwise
            newX = this.#height - 1 - y;
            newY = x;
            break;
          case 180: // 180 degrees
            newX = this.#width - 1 - x;
            newY = this.#height - 1 - y;
            break;
          case 270: // 270 degrees clockwise
            newX = y;
            newY = this.#width - 1 - x;
            break;
          default:
            newX = x;
            newY = y;
        }

        const newIndex = newY * newWidth + newX;
        newMatrix[newIndex] = this.#matrix[oldIndex]!;
      }
    }

    return { matrix: newMatrix, width: newWidth, height: newHeight };
  }

  rotate(degrees: number) {
    return this.#rotateImpl(degrees, false);
  }

  rotateInPlace(degrees: number) {
    return this.#rotateImpl(degrees, true);
  }

  get(x: number, y: number) {
    return this.#matrix[y * this.#width + x]!;
  }

  set(x: number, y: number, value: number) {
    this.#matrix[y * this.#width + x] = value;
  }
}
