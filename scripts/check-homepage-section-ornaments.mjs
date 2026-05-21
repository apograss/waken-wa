import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

const root = process.cwd()

const expectedAssets = [
  'public/assets/homepage/section-about-companion.png',
  'public/assets/homepage/section-now-companion.png',
  'public/assets/homepage/section-inspiration-companion.png',
]

const componentPath = join(root, 'components/homepage/homepage-section-ornament.tsx')
const reusedSectionPath = join(root, 'components/homepage/homepage-reused-section.tsx')
const cssPath = join(root, 'styles/homepage.css')

const failures = []

for (const asset of expectedAssets) {
  if (!existsSync(join(root, asset))) {
    failures.push(`missing asset: ${asset}`)
  }
}

if (!existsSync(componentPath)) {
  failures.push('missing component: components/homepage/homepage-section-ornament.tsx')
} else {
  const component = await readFile(componentPath, 'utf8')
  for (const asset of expectedAssets) {
    if (!component.includes(`/${asset.replace(/^public\//, '')}`)) {
      failures.push(`component does not reference ${asset}`)
    }
  }
  for (const required of ['aria-hidden="true"', 'alt=""', 'loading="lazy"', 'decoding="async"']) {
    if (!component.includes(required)) {
      failures.push(`component missing decorative image attribute: ${required}`)
    }
  }
}

const reusedSection = await readFile(reusedSectionPath, 'utf8')
for (const tone of ['about', 'now', 'inspiration']) {
  if (!reusedSection.includes(`tone="${tone}"`)) {
    failures.push(`homepage section missing ornament tone: ${tone}`)
  }
}

const css = await readFile(cssPath, 'utf8')
for (const selector of [
  '.section-ornament',
  '.sec-with-ornament',
  '@media (prefers-reduced-motion: reduce)',
]) {
  if (!css.includes(selector)) {
    failures.push(`homepage CSS missing selector: ${selector}`)
  }
}

if (failures.length) {
  console.error('Homepage section ornament check failed:')
  for (const failure of failures) {
    console.error(`- ${failure}`)
  }
  process.exit(1)
}

console.log('Homepage section ornament check passed.')
