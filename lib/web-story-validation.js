function isHttpUrl(value = '') {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export function validateWebStoryPayload({ title = '', coverImage = '', slides = [] } = {}) {
  const issues = []

  if (!title || title.trim().length < 8) {
    issues.push('Title should be at least 8 characters.')
  }

  if (!Array.isArray(slides) || slides.length < 4) {
    issues.push('Web Story should include at least 4 slides.')
  }

  if (!coverImage || !isHttpUrl(coverImage)) {
    issues.push('Cover image must be a valid absolute URL.')
  }

  if (Array.isArray(slides)) {
    slides.forEach((slide, index) => {
      if (!slide?.image || !isHttpUrl(slide.image)) {
        issues.push(`Slide ${index + 1}: image must be a valid absolute URL.`)
      }
      const headlineLength = (slide?.headline || '').trim().length
      if (headlineLength < 5 || headlineLength > 90) {
        issues.push(`Slide ${index + 1}: headline should be between 5 and 90 characters.`)
      }
      const descriptionLength = (slide?.description || '').trim().length
      if (descriptionLength > 280) {
        issues.push(`Slide ${index + 1}: description should be 280 characters or less.`)
      }
    })
  }

  return {
    valid: issues.length === 0,
    issues,
  }
}

