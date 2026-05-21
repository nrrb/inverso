export interface TextLayer {
  id: string
  content: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  fontFamily: string
  fontSize: number
  fontWeight: number
  italic: boolean
  letterSpacing: number
  lineHeight: number
  align: 'left' | 'center' | 'right'
}

export interface AppState {
  sourceImage: ImageBitmap | null
  sourceWidth: number
  sourceHeight: number
  transparentBgColor: string
  inversionMode: 'rgb' | 'luminance'
  textLayers: TextLayer[]
  selectedLayerId: string | null
  addingText: boolean
}

export interface FontInfo {
  family: string
  variants: string[]
  category: string
}

export type Handle = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w'

export interface DragState {
  type: 'none' | 'creating' | 'moving' | 'resizing'
  startX: number
  startY: number
  layerId?: string
  handle?: Handle
  origX?: number
  origY?: number
  origW?: number
  origH?: number
}
