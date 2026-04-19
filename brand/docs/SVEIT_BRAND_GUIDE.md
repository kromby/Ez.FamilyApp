# Sveit — Brand Guide

*Version 0.1 — for internal use by the app developer (aka me)*

---

## 1. The name

**Sveit** /sveit/ — an Icelandic word meaning both *a group of people who belong together* and *the countryside*. In English it reads as "svayt" or "sveht".

The double meaning is the whole point. Sveit is both the people you belong to and the place where they are. That maps directly to what the app does: messages + shared lists + locations, all in one private space.

### Tagline options
- **Þín sveit, alltaf með þér** (primary, Icelandic)
- **Fólkið þitt. Staðurinn þinn.** (alternative, Icelandic)
- **Your people. Your place.** (English, if/when international)

### Elevator pitch (one sentence)
Sveit is a private digital home for your family and closest friends, where you can chat, share lists, and see where everyone is — without signing your kids up for social media or paying for sketchy tracker apps that barely work in Iceland.

### Elevator pitch (one paragraph)
Google Family Link and Find My don't work reliably in Iceland, and Icelandic parents are stuck paying for unreliable tracker apps or signing their kids up for Instagram and Snapchat just to stay in touch. Sveit is the alternative: a single private space for your inner circle, with messaging, shared lists, location sharing, and photo sharing — built for families first, not retrofitted from a social media product. No feed, no likes, no algorithm. Just your people.

---

## 2. Brand personality

Sveit is **warm, calm, trustworthy, and Icelandic**. It is not a tech startup shouting for attention. It is the digital equivalent of the sumarbústaður — a place you go to be with the people who matter.

### Voice characteristics
- **Warm, not cute.** We are not a toy. We are where families talk about real things.
- **Confident, not corporate.** We know what we are and we do not apologise for being small or local.
- **Quiet, not loud.** No exclamation marks in marketing. No "AMAZING NEW FEATURES". Just clear, honest communication.
- **Personal, not generic.** We speak to one family at a time.

### What Sveit is not
- Not a social network
- Not a surveillance tool
- Not a productivity app
- Not "just another chat app"

### Voice examples

**Good** ✅
> Sveit er staðurinn þar sem fjölskyldan þín býr. Skilaboð, listar, staðsetningar. Allt á einum stað.

**Bad** ❌
> 🚀 Revolutionize your family communication with Sveit! Amazing features, incredible design!

**Good** ✅
> Við geymum ekki skilaboðin þín. Við skoðum þau ekki. Þetta er þitt rými.

**Bad** ❌
> Sveit leverages cutting-edge encryption to deliver best-in-class privacy.

---

## 3. The logo

The mark is a hand-painted watercolor illustration showing a family of five figures in warm earth tones, sheltered under an abstract green mountain-roof shape. The wordmark "sveit" sits below in lowercase.

### What the logo represents
- **The green mountain/roof shape** — shelter, home, Icelandic landscape. Both meanings of sveit in one stroke.
- **The family figures in red and blue** — the people inside the shelter. The different colors suggest individuals, not a uniform group.
- **Watercolor texture** — warmth, humanity, something handmade rather than mass-produced. This is deliberate and important. It signals "not another tech product".
- **Lowercase wordmark** — approachable, informal, human.

### Logo usage

**Do**
- Use on cream, white, or very light backgrounds where the watercolor texture reads clearly
- Leave generous whitespace around the mark (minimum clear space = height of the "s" in "sveit")
- Use the full lockup (icon + wordmark) for primary applications
- Use the icon alone for app icons, favicons, and social avatars

**Don't**
- Do not redraw the mark in flat vector style. The watercolor texture is the point.
- Do not place on busy backgrounds or photography
- Do not change the colors of the figures or the mountain
- Do not stretch, skew, or rotate
- Do not add drop shadows, outlines, or effects
- Do not use on dark backgrounds (design a dark mode variant separately if needed)

### Minimum sizes
- **Icon alone**: 24px (favicon), 48px (UI), 1024px (app store)
- **Full lockup**: 120px wide minimum for legibility of the wordmark

---

## 4. Color palette

Warm, earthy, Icelandic. Taken directly from the logo.

### Primary colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Cream | `#F5EEDC` | 245, 238, 220 | Background, primary surface |
| Moss Green | `#8BA888` | 139, 168, 136 | Mountain/shelter, primary accent |
| Terracotta | `#C67A5C` | 198, 122, 92 | Warm figures, secondary accent, CTAs |
| Dusty Blue | `#7A95B0` | 122, 149, 176 | Cool figures, tertiary accent |
| Charcoal | `#3D3D3D` | 61, 61, 61 | Body text, wordmark |

### Supporting neutrals

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Soft White | `#FBF8F0` | 251, 248, 240 | Alternate surface |
| Warm Gray | `#8A857A` | 138, 133, 122 | Secondary text, dividers |
| Deep Moss | `#5C6B5A` | 92, 107, 90 | Hover states, darker accents |

### Color rules
- **Cream is the default background**, not white. White feels sterile; cream feels warm.
- **Use terracotta for primary CTAs** (Send, Confirm, Add to list)
- **Use moss green for secondary/positive states** (Saved, Online, Arrived)
- **Use dusty blue sparingly** for informational states
- **Never use pure black.** Always charcoal `#3D3D3D`.
- **Never use neon, bright corporate blue, or saturated Material Design colors.** They break the warmth.

### Dark mode (future)

| Name | Hex | Usage |
|------|-----|-------|
| Night | `#1F1E1A` | Background |
| Pine | `#2C3A2C` | Surface |
| Cream (dimmed) | `#E8DFC9` | Primary text |

Dark mode should still feel warm, not black-and-blue. Think evening in a cabin, not a tech product in "dark mode".

---

## 5. Typography

### Primary typeface: Inter
Clean, modern, humanist sans-serif. Excellent Icelandic character support (þ, ð, æ, ö, á, é, í, ó, ú, ý). Free and open source. Works everywhere.

**Fallback stack**
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

### Type scale

| Role | Size | Weight | Line height | Usage |
|------|------|--------|-------------|-------|
| Display | 40px / 2.5rem | 600 | 1.2 | Landing page hero |
| H1 | 32px / 2rem | 600 | 1.25 | Page titles |
| H2 | 24px / 1.5rem | 600 | 1.3 | Section titles |
| H3 | 20px / 1.25rem | 500 | 1.4 | Subsections |
| Body | 16px / 1rem | 400 | 1.5 | Default text |
| Small | 14px / 0.875rem | 400 | 1.5 | Metadata, timestamps |
| Tiny | 12px / 0.75rem | 500 | 1.4 | Labels, captions |

### Type rules
- **Use lowercase for the wordmark always.** "sveit" never "Sveit" or "SVEIT" in the logo.
- **In body copy, treat Sveit as a proper noun.** Capitalized at start of sentence.
- **Line length**: aim for 50 to 75 characters per line for readability
- **No justified text.** Left-aligned only.
- **No fake italics or bold.** If you need italic or bold, use the actual font weight.

### Icelandic typography notes
- Inter handles Icelandic characters well. Test þ, ð, æ specifically in any UI.
- Icelandic text is typically 10 to 15% longer than English. Design UI with extra breathing room.
- Avoid all-caps for Icelandic text. It reduces readability and looks aggressive.

---

## 6. Iconography

Icons should feel consistent with the watercolor logo without trying to replicate its texture in UI (which would be a nightmare at small sizes).

### Icon style
- **Lucide React** as the base icon set (clean, rounded, open source, works with React)
- **Stroke width: 2px** for standard UI
- **Corner radius: moderate** (not razor sharp, not bubbly)
- **Filled variants** for active/selected states, outlined for default

### Icons to avoid
- Overly playful cartoon icons
- Skeuomorphic icons with gradients and shadows
- Razor-sharp technical icons (too cold)
- Anything from Material Design's default set (too corporate)

---

## 7. Imagery and illustration

### Photography
If using photography (avoid on core product UI, fine for marketing):
- Warm, natural light only. No studio lighting.
- Real Icelandic families, not stock photos.
- Candid over posed.
- Nature, home interiors, everyday moments. No office scenes.

### Illustration
If commissioning illustrations:
- Watercolor or hand-drawn feel, consistent with the logo
- Same color palette
- Simple, human-focused compositions
- Icelandic landscape elements welcome (fjöll, mosi, sumarbústaður)

### Stock imagery
Avoid. It almost always looks generic and breaks the warmth. If unavoidable, use Unsplash's "Iceland" and "family" collections sparingly.

---

## 8. UI/UX principles

These are the rules the app itself should follow, derived from the brand.

### Core principles

1. **Quiet by default.** No push notifications unless the user opts in. No badges screaming for attention. No red dots everywhere.
2. **Privacy is visible.** Show people that their data is theirs. End-to-end encryption indicators, clear data retention policies, obvious delete buttons.
3. **Location is shared, not tracked.** The word we use is "deila" (share), never "fylgjast með" (monitor). Kids see when parents can see them. Transparency is the default.
4. **No feed. No algorithm. No engagement optimization.** Chronological always. No "for you" anything. The app should be boring when there's nothing new, and that is a feature.
5. **Children first.** The UI must work for an 8-year-old. Large tap targets, simple language, no dark patterns, no ads.
6. **Icelandic first, English as fallback.** Ship in Icelandic first. English comes when Iceland is solid.

### Interaction patterns
- **Generous whitespace.** Cream breathing room is part of the brand.
- **Soft animations.** Ease-in-out, 200 to 300ms. No bouncy springs, no aggressive transitions.
- **Haptic feedback sparingly.** Only for meaningful moments (message sent, list item completed).
- **Undo over confirm.** Prefer "deleted — undo?" over "are you sure you want to delete?".

---

## 9. Naming conventions (inside the product)

When naming features and UI elements, stay in the world of the brand. Warm, human, Icelandic where possible.

| Feature | Good name | Bad name |
|---------|-----------|---------|
| Group of users | Sveit (the group itself) | Workspace, Team, Organization |
| Chat | Spjall | Chat, Channel |
| Shared list | Listi | Board, Task List |
| Location | Staðsetning | Tracking, GPS |
| Photo share | Myndir | Media, Gallery |
| Settings | Stillingar | Config, Preferences |

Rule of thumb: if it sounds like Slack, rename it.

---

## 10. Marketing and communication

### Writing rules for Icelandic
- Informal tone (þú, not þér)
- Short sentences. Icelandic readers don't need to be lectured to.
- No corporate filler ("markviss lausn", "framtíðarsýn", "nýsköpun" — drop it all)
- Commas over em dashes (matches my personal style preference anyway)

### Writing rules for English
- American or British is fine, pick one and stick with it (recommend British, closer to Icelandic sensibility)
- Short sentences
- No buzzwords
- Never translate Icelandic idioms literally. Rewrite for English readers.

### What to talk about
- The privacy story (especially vs Meta, Google, TikTok)
- The "doesn't work in Iceland" problem with Family Link/Find My
- Real family use cases, not hypothetical ones
- The fact that Sveit was built by a dad for his own family

### What not to talk about
- Competitors by name (punching down)
- Technical architecture details (nobody cares)
- Funding rounds (if they happen)
- Growth metrics (keep it personal)

---

## 11. Do's and Don'ts summary

### Do
✅ Use cream as the default background  
✅ Keep the watercolor logo untouched  
✅ Write in short, warm, direct sentences  
✅ Ship in Icelandic first  
✅ Design for an 8-year-old as well as an adult  
✅ Use terracotta for primary actions  
✅ Treat whitespace as a feature  

### Don't
❌ Don't redraw the logo in flat vector  
❌ Don't use pure black or pure white  
❌ Don't use exclamation marks in marketing  
❌ Don't name things like a Slack clone  
❌ Don't add a feed, algorithm, or engagement metrics  
❌ Don't use stock photos of smiling families at sunset  
❌ Don't translate Icelandic directly to English  

---

## 12. File and asset organization

```
/brand
  /logo
    sveit-logo-full.png
    sveit-logo-full.svg
    sveit-icon-1024.png
    sveit-icon-512.png
    sveit-icon-256.png
    sveit-icon-favicon.ico
  /colors
    palette.ase
    palette.sketchpalette
    tokens.css
  /fonts
    Inter-*.woff2
  /docs
    SVEIT_BRAND_GUIDE.md
    voice-examples.md
```

### Design tokens (CSS)
```css
:root {
  /* Colors */
  --sveit-cream: #F5EEDC;
  --sveit-moss: #8BA888;
  --sveit-terracotta: #C67A5C;
  --sveit-blue: #7A95B0;
  --sveit-charcoal: #3D3D3D;
  --sveit-soft-white: #FBF8F0;
  --sveit-warm-gray: #8A857A;
  --sveit-deep-moss: #5C6B5A;

  /* Typography */
  --sveit-font-primary: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  
  /* Spacing */
  --sveit-space-xs: 4px;
  --sveit-space-sm: 8px;
  --sveit-space-md: 16px;
  --sveit-space-lg: 24px;
  --sveit-space-xl: 40px;
  
  /* Radius */
  --sveit-radius-sm: 6px;
  --sveit-radius-md: 12px;
  --sveit-radius-lg: 20px;
  
  /* Transitions */
  --sveit-ease: cubic-bezier(0.4, 0, 0.2, 1);
  --sveit-duration: 250ms;
}
```

---

## 13. Version history

| Version | Date | Changes |
|---------|------|---------|
| 0.1 | 2026-04-18 | Initial brand guide, based on original watercolor logo |

---

*This is a living document. Update it as the brand evolves. If something in the product doesn't match this guide, either fix the product or update the guide — whichever is more honest.*
