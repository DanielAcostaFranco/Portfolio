/** Optional edge-connected white removal. Enclosed white details remain intact. */
export function removeWhiteEdges(pixels: Uint8ClampedArray, width: number, height: number): Uint8ClampedArray {
    if (width < 1 || height < 1 || !Number.isInteger(width) || !Number.isInteger(height) || pixels.length !== width * height * 4)
        throw new Error("Invalid pixel dimensions");
    const output = new Uint8ClampedArray(pixels), visited = new Uint8Array(width * height), queue = new Uint32Array(width * height);
    let head = 0, tail = 0;
    const visit = (index: number) => {
        if (visited[index])
            return;
        visited[index] = 1;
        const i = index * 4;
        if (output[i + 3] < 8 || (output[i] > 243 && output[i + 1] > 243 && output[i + 2] > 243)) {
            queue[tail++] = index;
            output[i + 3] = 0;
        }
    };
    for (let x = 0; x < width; x++) {
        visit(x);
        visit((height - 1) * width + x);
    }
    for (let y = 0; y < height; y++) {
        visit(y * width);
        visit(y * width + width - 1);
    }
    while (head < tail) {
        const i = queue[head++], x = i % width, y = Math.floor(i / width);
        if (x > 0)
            visit(i - 1);
        if (x < width - 1)
            visit(i + 1);
        if (y > 0)
            visit(i - width);
        if (y < height - 1)
            visit(i + width);
    }
    return output;
}
