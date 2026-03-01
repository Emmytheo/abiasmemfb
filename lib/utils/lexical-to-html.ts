/**
 * Converts a Payload/Lexical JSON document to HTML string.
 * Supports: headings, paragraphs, text formatting, lists, links,
 * blockquotes, horizontal rules, and inline images.
 */

type LexicalNode = {
    type: string
    version?: number
    children?: LexicalNode[]
    text?: string
    format?: number | string
    tag?: string
    listType?: 'bullet' | 'number' | 'check'
    checked?: boolean
    url?: string
    rel?: string
    newTab?: boolean
    fields?: { url?: string; alt?: string; caption?: any }
    value?: { url?: string; alt?: string; filename?: string; width?: number; height?: number }
    direction?: string | null
    indent?: number
    [key: string]: any
}

// Lexical text format flags
const FORMAT_BOLD = 0x1
const FORMAT_ITALIC = 0x2
const FORMAT_STRIKETHROUGH = 0x4
const FORMAT_UNDERLINE = 0x8
const FORMAT_CODE = 0x10
const FORMAT_SUBSCRIPT = 0x20
const FORMAT_SUPERSCRIPT = 0x40
const FORMAT_HIGHLIGHT = 0x80

function formatText(text: string, format: number): string {
    let result = escapeHtml(text)
    if (format & FORMAT_CODE) result = `<code>${result}</code>`
    if (format & FORMAT_BOLD) result = `<strong>${result}</strong>`
    if (format & FORMAT_ITALIC) result = `<em>${result}</em>`
    if (format & FORMAT_UNDERLINE) result = `<u>${result}</u>`
    if (format & FORMAT_STRIKETHROUGH) result = `<s>${result}</s>`
    if (format & FORMAT_SUBSCRIPT) result = `<sub>${result}</sub>`
    if (format & FORMAT_SUPERSCRIPT) result = `<sup>${result}</sup>`
    if (format & FORMAT_HIGHLIGHT) result = `<mark>${result}</mark>`
    return result
}

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
}

function convertChildren(children: LexicalNode[]): string {
    return children.map(convertNode).join('')
}

function convertNode(node: LexicalNode): string {
    switch (node.type) {
        case 'root':
            return convertChildren(node.children || [])

        case 'paragraph': {
            const inner = convertChildren(node.children || [])
            if (!inner.trim()) return '<p>&nbsp;</p>\n'
            return `<p>${inner}</p>\n`
        }

        case 'heading': {
            const tag = node.tag || 'h2'
            return `<${tag}>${convertChildren(node.children || [])}</${tag}>\n`
        }

        case 'text': {
            if (!node.text && node.text !== '') return ''
            const fmt = typeof node.format === 'number' ? node.format : 0
            return formatText(node.text, fmt)
        }

        case 'linebreak':
            return '<br />'

        case 'list': {
            const tag = node.listType === 'number' ? 'ol' : 'ul'
            const cls = node.listType === 'check' ? ' class="checklist"' : ''
            return `<${tag}${cls}>${convertChildren(node.children || [])}</${tag}>\n`
        }

        case 'listitem': {
            if (node.checked !== undefined) {
                const checked = node.checked ? ' checked' : ''
                return `<li class="checklist-item"><input type="checkbox"${checked} disabled /> ${convertChildren(node.children || [])}</li>\n`
            }
            return `<li>${convertChildren(node.children || [])}</li>\n`
        }

        case 'link': {
            const url = node.fields?.url || node.url || '#'
            const target = node.newTab || node.fields?.newTab ? ' target="_blank" rel="noopener noreferrer"' : ''
            return `<a href="${escapeHtml(url)}"${target}>${convertChildren(node.children || [])}</a>`
        }

        case 'autolink': {
            const url = node.url || '#'
            return `<a href="${escapeHtml(url)}">${convertChildren(node.children || [])}</a>`
        }

        case 'quote':
        case 'blockquote':
            return `<blockquote>${convertChildren(node.children || [])}</blockquote>\n`

        case 'horizontalrule':
            return '<hr />\n'

        case 'code': {
            const lang = node.language ? ` class="language-${node.language}"` : ''
            return `<pre><code${lang}>${convertChildren(node.children || [])}</code></pre>\n`
        }

        case 'code-highlight':
            return escapeHtml(node.text || '')

        case 'upload': {
            // Payload upload node — value is the media document
            const media = node.value
            if (!media) return ''
            const src = media.url || ''
            const alt = media.alt || media.filename || ''
            const width = media.width ? ` width="${media.width}"` : ''
            const height = media.height ? ` height="${media.height}"` : ''
            const caption = node.fields?.caption
            const captionHtml = caption
                ? `<figcaption>${typeof caption === 'string' ? escapeHtml(caption) : ''}</figcaption>`
                : ''
            return `<figure><img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}"${width}${height} loading="lazy" />${captionHtml}</figure>\n`
        }

        case 'image': {
            const src = node.src || node.url || ''
            const alt = node.altText || node.alt || ''
            return `<figure><img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" loading="lazy" /></figure>\n`
        }

        default:
            // Unknown node: try to render children if they exist
            if (node.children) return convertChildren(node.children)
            return ''
    }
}

/**
 * Convert a Lexical JSON document (or stringified JSON) to an HTML string.
 * Returns an empty string if input is null/undefined/empty.
 */
export function lexicalToHtml(content: any): string {
    if (!content) return ''

    let doc = content

    // If it was accidentally stringified, parse it back
    if (typeof content === 'string') {
        if (!content.trim().startsWith('{')) return content // already plain text / HTML
        try {
            doc = JSON.parse(content)
        } catch {
            return content
        }
    }

    // Payload wraps the lexical state in { root: {...} }
    const root: LexicalNode = doc.root ?? doc

    try {
        return convertNode(root)
    } catch (e) {
        console.error('lexicalToHtml conversion error:', e)
        return ''
    }
}
