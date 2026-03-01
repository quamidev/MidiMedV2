# Styling Standard

## Framework
Tailwind CSS 4 with OKLCH color system

## Configuration
- Theme: `src/app/globals.css`
- Style: shadcn/ui new-york variant
- Base color: neutral

## Color System

```css
/* Primary brand color - teal */
--primary: oklch(62% 0.12 195);

/* Semantic colors */
--background: oklch(100% 0 0);
--foreground: oklch(14.5% 0 0);
--muted: oklch(96% 0 0);
--destructive: oklch(57% 0.22 27);
```

## Usage Pattern

```tsx
// Use semantic color classes
<div className="bg-background text-foreground">
  <Button className="bg-primary text-primary-foreground">
    Click me
  </Button>
</div>

// Use cn() for conditional classes
<div className={cn(
  'rounded-lg border p-4',
  isActive && 'border-primary bg-primary/10',
  className
)}>
```

## Dark Mode
- Uses `.dark` class on html element
- Define dark variants in globals.css
- ThemeProvider handles toggle

## Spacing Scale
Use Tailwind defaults: `0.25rem` increments
- p-4 = 1rem
- gap-6 = 1.5rem
- my-8 = 2rem

## Typography
- Font: Source Sans Pro (variable)
- Base size: 14px (text-sm default)
- Headings: font-semibold or font-bold

---

## DOs
- Use semantic color variables
- Apply consistent border-radius (rounded-lg default)
- Use shadow-sm, shadow-md for depth
- Maintain 4px/8px spacing rhythm

## DON'Ts
- Do NOT use arbitrary color values
- Do NOT use `style={}` inline styles
- Do NOT override component base styles
- Do NOT mix rem and px units
