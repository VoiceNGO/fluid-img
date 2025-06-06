// Debug version to understand the bounds issue

(() => {
  const ELEMENTS_PER_REMOVAL = 4;

  function uint16ArraySetRemovalSequential(array, seamIndices, elementsPerRemoval) {
    console.log(`Input array length: ${array.length}, seamIndices length: ${seamIndices.length}`);
    console.log(`First few seamIndices: ${seamIndices.slice(0, 10)}`);
    console.log(`Last few seamIndices: ${seamIndices.slice(-10)}`);

    const newSize = array.length - seamIndices.length;
    console.log(`Calculated newSize: ${newSize}`);

    const result = new Uint16Array(newSize);
    let resultOffset = 0;
    let sourceStart = 0;

    for (let i = 0; i < seamIndices.length; i++) {
      const deleteIndex = seamIndices[i];
      console.log(
        `Processing deleteIndex ${i}: ${deleteIndex}, sourceStart: ${sourceStart}, resultOffset: ${resultOffset}`
      );

      const chunkSize = deleteIndex - sourceStart;
      console.log(`ChunkSize: ${chunkSize}`);

      if (chunkSize > 0) {
        if (resultOffset + chunkSize > result.length) {
          console.error(
            `ERROR: resultOffset (${resultOffset}) + chunkSize (${chunkSize}) = ${resultOffset + chunkSize} > result.length (${result.length})`
          );
          break;
        }
        if (deleteIndex > array.length) {
          console.error(`ERROR: deleteIndex (${deleteIndex}) > array.length (${array.length})`);
          break;
        }
        result.set(array.subarray(sourceStart, deleteIndex), resultOffset);
        resultOffset += chunkSize;
      }
      sourceStart = deleteIndex + 1;

      if (i > 5) break; // Only debug first few iterations
    }

    return result;
  }

  function generateSeamIndices(imageWidth, imageHeight, numSeams, elementsPerRemoval) {
    const seams = [];

    for (let seamNum = 0; seamNum < numSeams; seamNum++) {
      const seamIndices = [];
      for (let row = 0; row < imageHeight; row++) {
        const rowStart = row * imageWidth * 4;
        const maxPixelInRow = imageWidth - 1;
        const randomPixel = Math.floor(Math.random() * maxPixelInRow);
        const pixelIndex = rowStart + randomPixel * 4;

        for (let i = 0; i < elementsPerRemoval; i++) {
          seamIndices.push(pixelIndex + i);
        }
      }
      seams.push(seamIndices.sort((a, b) => a - b));
    }

    return seams;
  }

  // Test with small array
  const imageWidth = 4;
  const imageHeight = 3;
  const arraySize = imageWidth * imageHeight * 4; // 48 elements
  const baseArray = new Uint16Array(arraySize);
  for (let i = 0; i < arraySize; i++) {
    baseArray[i] = i;
  }

  console.log(`Base array: [${baseArray.join(', ')}]`);

  const seamIndices = generateSeamIndices(imageWidth, imageHeight, 2, ELEMENTS_PER_REMOVAL);
  console.log(`Generated ${seamIndices.length} seams`);

  let array = new Uint16Array(baseArray);
  for (let i = 0; i < seamIndices.length; i++) {
    console.log(`\n=== Removing seam ${i} ===`);
    console.log(`Current array length: ${array.length}`);
    array = uint16ArraySetRemovalSequential(array, seamIndices[i], ELEMENTS_PER_REMOVAL);
    console.log(`New array length: ${array.length}`);
  }
})();
