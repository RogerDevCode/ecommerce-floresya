#!/usr/bin/env node

/**
 * Custom CSS Build Script for Tailwind CSS v4
 * FloresYa E-commerce - Enterprise TypeScript Edition
 */

import { readFile, writeFile, mkdir } from 'fs/promises'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import postcss from 'postcss'
import tailwindcss from '@tailwindcss/postcss'
import autoprefixer from 'autoprefixer'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = resolve(__dirname, '..')

async function buildCSS() {
  try {
    console.log('🌸 Building CSS with Tailwind CSS v4...')

    // Ensure output directory exists
    const outputDir = resolve(projectRoot, 'public/css')
    await mkdir(outputDir, { recursive: true })

    // Read input CSS
    const inputPath = resolve(projectRoot, 'src/styles.css')
    const inputCSS = await readFile(inputPath, 'utf8')

    // Process with PostCSS
    const processor = postcss([
      tailwindcss(),
      autoprefixer()
    ])

    const result = await processor.process(inputCSS, {
      from: inputPath,
      to: resolve(outputDir, 'styles.css')
    })

    // Write output
    const outputPath = resolve(outputDir, 'styles.css')
    await writeFile(outputPath, result.css)

    if (result.map) {
      await writeFile(outputPath + '.map', result.map.toString())
    }

    console.log('✅ CSS build completed successfully!')
    console.log(`📄 Output: ${outputPath}`)

  } catch (error) {
    console.error('❌ CSS build failed:', error)
    process.exit(1)
  }
}

buildCSS()