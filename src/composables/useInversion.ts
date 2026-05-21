import { drawText } from 'canvas-txt'
import type { TextLayer, AppState } from '../types'

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ]
}

function invertRGB(r: number, g: number, b: number): [number, number, number] {
  return [255 - r, 255 - g, 255 - b]
}

function invertLuminance(r: number, g: number, b: number): [number, number, number] {
  const L = 0.299 * r + 0.587 * g + 0.114 * b
  const v = L > 127 ? 0 : 255
  return [v, v, v]
}

function buildTextMask(layer: TextLayer): OffscreenCanvas {
  const canvas = new OffscreenCanvas(Math.ceil(layer.width), Math.ceil(layer.height))
  const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D
  if (!ctx) return canvas

  ctx.clearRect(0, 0, layer.width, layer.height)
  ctx.fillStyle = '#ffffff'

  if ('letterSpacing' in ctx) {
    (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${layer.letterSpacing}px`
  }

  drawText(ctx, layer.content || '', {
    x: 0,
    y: 0,
    width: layer.width,
    height: layer.height,
    fontSize: layer.fontSize,
    fontWeight: String(layer.fontWeight),
    fontStyle: layer.italic ? 'italic' : 'normal',
    font: `"${layer.fontFamily}"`,
    align: layer.align,
    vAlign: 'top',
    lineHeight: layer.lineHeight * layer.fontSize,
  })

  return canvas
}

export async function renderLayerToContext(
  outCtx: CanvasRenderingContext2D,
  layer: TextLayer,
  sourceImageData: ImageData,
  sourceWidth: number,
  sourceHeight: number,
  bgColor: string,
  inversionMode: 'rgb' | 'luminance',
  displayScale: number,
  imgOffX = 0,
  imgOffY = 0,
): Promise<void> {
  const nativeW = Math.ceil(layer.width)
  const nativeH = Math.ceil(layer.height)

  const mask = buildTextMask(layer)
  const maskCtx = mask.getContext('2d') as unknown as CanvasRenderingContext2D
  if (!maskCtx) return
  const maskData = maskCtx.getImageData(0, 0, nativeW, nativeH)

  const [bgR, bgG, bgB] = hexToRgb(bgColor)
  const invert = inversionMode === 'rgb' ? invertRGB : invertLuminance

  const resultCanvas = new OffscreenCanvas(nativeW, nativeH)
  const resultCtx = resultCanvas.getContext('2d') as unknown as CanvasRenderingContext2D
  if (!resultCtx) return
  const resultData = resultCtx.createImageData(nativeW, nativeH)

  for (let py = 0; py < nativeH; py++) {
    for (let px = 0; px < nativeW; px++) {
      const i = (py * nativeW + px) * 4
      const maskAlpha = maskData.data[i + 3]
      if (maskAlpha === 0) continue

      const srcX = Math.floor(layer.x) + px
      const srcY = Math.floor(layer.y) + py

      let r: number, g: number, b: number
      if (srcX < 0 || srcY < 0 || srcX >= sourceWidth || srcY >= sourceHeight) {
        r = bgR; g = bgG; b = bgB
      } else {
        const si = (srcY * sourceWidth + srcX) * 4
        if (sourceImageData.data[si + 3] > 0) {
          r = sourceImageData.data[si]
          g = sourceImageData.data[si + 1]
          b = sourceImageData.data[si + 2]
        } else {
          r = bgR; g = bgG; b = bgB
        }
      }

      const [ir, ig, ib] = invert(r, g, b)
      resultData.data[i] = ir
      resultData.data[i + 1] = ig
      resultData.data[i + 2] = ib
      resultData.data[i + 3] = maskAlpha
    }
  }

  resultCtx.putImageData(resultData, 0, 0)

  const s = displayScale
  const cx = imgOffX + (layer.x + layer.width / 2) * s
  const cy = imgOffY + (layer.y + layer.height / 2) * s
  outCtx.save()
  outCtx.translate(cx, cy)
  outCtx.rotate((layer.rotation * Math.PI) / 180)
  outCtx.drawImage(
    resultCanvas as unknown as HTMLCanvasElement,
    (-layer.width / 2) * s,
    (-layer.height / 2) * s,
    layer.width * s,
    layer.height * s,
  )
  outCtx.restore()
}

export function renderAll(
  ctx: CanvasRenderingContext2D,
  state: AppState,
  displayScale: number,
  sourceImageData: ImageData | null,
  canvasW: number,
  canvasH: number,
  imgOffX: number,
  imgOffY: number,
): void {
  ctx.fillStyle = state.transparentBgColor
  ctx.fillRect(0, 0, canvasW, canvasH)

  if (state.sourceImage) {
    ctx.drawImage(state.sourceImage, imgOffX, imgOffY, state.sourceWidth * displayScale, state.sourceHeight * displayScale)
  }

  if (!sourceImageData) return

  for (const layer of state.textLayers) {
    renderLayerToContext(
      ctx, layer, sourceImageData,
      state.sourceWidth, state.sourceHeight,
      state.transparentBgColor, state.inversionMode,
      displayScale, imgOffX, imgOffY,
    )
  }
}

function layerRotatedBounds(layer: TextLayer) {
  const cx = layer.x + layer.width / 2
  const cy = layer.y + layer.height / 2
  const rad = (layer.rotation * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  const corners: [number, number][] = [
    [layer.x, layer.y],
    [layer.x + layer.width, layer.y],
    [layer.x, layer.y + layer.height],
    [layer.x + layer.width, layer.y + layer.height],
  ].map(([px, py]) => {
    const dx = px - cx; const dy = py - cy
    return [cx + dx * cos - dy * sin, cy + dx * sin + dy * cos]
  })
  return {
    minX: Math.min(...corners.map(([x]) => x)),
    minY: Math.min(...corners.map(([, y]) => y)),
    maxX: Math.max(...corners.map(([x]) => x)),
    maxY: Math.max(...corners.map(([, y]) => y)),
  }
}

export async function exportPNG(state: AppState, sourceImageData: ImageData): Promise<void> {
  // Smallest rectangle that contains the image and all (rotated) text layers
  let minX = 0, minY = 0, maxX = state.sourceWidth, maxY = state.sourceHeight
  for (const layer of state.textLayers) {
    const b = layerRotatedBounds(layer)
    minX = Math.min(minX, b.minX)
    minY = Math.min(minY, b.minY)
    maxX = Math.max(maxX, b.maxX)
    maxY = Math.max(maxY, b.maxY)
  }
  minX = Math.floor(minX); minY = Math.floor(minY)
  maxX = Math.ceil(maxX);  maxY = Math.ceil(maxY)

  const exportW = maxX - minX
  const exportH = maxY - minY
  const canvas = document.createElement('canvas')
  canvas.width = exportW
  canvas.height = exportH
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = state.transparentBgColor
  ctx.fillRect(0, 0, exportW, exportH)

  if (state.sourceImage) {
    ctx.drawImage(state.sourceImage, -minX, -minY)
  }

  for (const layer of state.textLayers) {
    await renderLayerToContext(ctx, layer, sourceImageData, state.sourceWidth, state.sourceHeight, state.transparentBgColor, state.inversionMode, 1, -minX, -minY)
  }

  canvas.toBlob((blob) => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'inverso-export.png'
    a.click()
    URL.revokeObjectURL(url)
  }, 'image/png')
}
