const loadedFonts = new Set<string>()

function variantToCSS(variant: string): { weight: string; style: string } {
  if (variant.endsWith('italic')) {
    return { weight: variant.replace('italic', '') || '400', style: 'italic' }
  }
  return { weight: variant, style: 'normal' }
}

export async function loadFont(family: string, variants: string[]): Promise<void> {
  const key = `${family}:${variants.join(',')}`
  if (loadedFonts.has(key)) return

  const variantParam = variants
    .map((v) => {
      const { weight, style } = variantToCSS(v)
      return style === 'italic' ? `1,${weight}` : `0,${weight}`
    })
    .join(';')

  const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:ital,wght@${variantParam}&display=swap`

  const existing = document.querySelector(`link[data-font="${family}"]`)
  if (!existing) {
    await new Promise<void>((resolve) => {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = url
      link.setAttribute('data-font', family)
      link.onload = () => resolve()
      link.onerror = () => resolve()
      document.head.appendChild(link)
    })
  }

  const promises = variants.map((v) => {
    const { weight, style } = variantToCSS(v)
    return document.fonts.load(`${style} ${weight} 16px "${family}"`)
  })

  await Promise.all(promises)
  loadedFonts.add(key)
}

export function fontCSSString(layer: {
  fontWeight: number
  italic: boolean
  fontSize: number
  fontFamily: string
}): string {
  return `${layer.italic ? 'italic' : 'normal'} ${layer.fontWeight} ${layer.fontSize}px "${layer.fontFamily}"`
}
