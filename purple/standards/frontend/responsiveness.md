# Responsiveness Standard

## Breakpoints (Tailwind defaults)

| Prefix | Min Width | Common Use |
|--------|-----------|------------|
| (none) | 0px | Mobile first base |
| `sm:` | 640px | Large phones |
| `md:` | 768px | Tablets |
| `lg:` | 1024px | Laptops |
| `xl:` | 1280px | Desktops |

## Mobile-First Approach
Write base styles for mobile, add breakpoint modifiers for larger screens.

```tsx
<div className="flex flex-col md:flex-row gap-4 md:gap-6">
  <div className="w-full md:w-1/2">...</div>
  <div className="w-full md:w-1/2">...</div>
</div>
```

## Layout Patterns

### Protected App Layout
```
┌─────────────────────────────────────────────────────┐
│ Desktop (lg+)                                       │
│ ┌────────┬─────────────────────────────────────┐   │
│ │Sidebar │         Main Content                │   │
│ │ 256px  │         flex-1                      │   │
│ │collaps.│                                     │   │
│ └────────┴─────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ Mobile (<lg)                                        │
│ ┌─────────────────────────────────────────────┐    │
│ │            Top Header                        │    │
│ ├─────────────────────────────────────────────┤    │
│ │                                             │    │
│ │            Main Content                     │    │
│ │            (full width)                     │    │
│ │                                             │    │
│ ├─────────────────────────────────────────────┤    │
│ │            Bottom Tabs                      │    │
│ └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

### Common Patterns

```tsx
// Hide on mobile, show on desktop
<div className="hidden lg:block">Desktop only</div>

// Show on mobile, hide on desktop
<div className="lg:hidden">Mobile only</div>

// Responsive grid
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

// Responsive padding
<div className="px-4 sm:px-6 lg:px-8">

// Responsive text
<h1 className="text-2xl sm:text-3xl lg:text-4xl">
```

---

## DOs
- Test on 375px width (iPhone SE)
- Use container with max-w-7xl for content
- Stack elements on mobile, row on desktop
- Make touch targets at least 44px

## DON'Ts
- Do NOT use fixed widths
- Do NOT hide critical content on mobile
- Do NOT rely on hover states for mobile
- Do NOT use horizontal scroll for main content
