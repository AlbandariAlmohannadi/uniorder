# UniOrder Design System

## Overview
A modern, professional design system inspired by Linear, Stripe, Notion, and Raycast. Focused on clarity, elegant depth, and guided motion for high-pressure restaurant environments.

## Color Palette

### Primary Colors
- **Primary 600**: `#2563eb` - Main brand color
- **Primary 700**: `#1d4ed8` - Darker variant

### Status Colors
- **Success**: `#10b981` - Completed orders, positive actions
- **Warning**: `#f59e0b` - Pending orders, caution states
- **Danger**: `#ef4444` - Cancelled orders, errors
- **Gray**: `#18181b` to `#fafafa` - Text and backgrounds

## Gradients

### Header
```css
background: linear-gradient(135deg, #0f172a, #1e293b);
```

### Primary Actions
```css
background: linear-gradient(135deg, #2563eb, #1d4ed8);
```

### Status Indicators
- **New Orders**: `linear-gradient(135deg, #fde68a, #f59e0b)`
- **Success**: `linear-gradient(135deg, #10b981, #059669)`
- **Cards**: `linear-gradient(135deg, #ffffff, #f8fafc)`

## Shadows & Depth

### Card Shadows
- **Default**: `0 4px 12px rgba(0, 0, 0, 0.1)`
- **Hover**: `0 8px 20px rgba(0, 0, 0, 0.12)`
- **Modal**: `0 20px 40px rgba(0, 0, 0, 0.2)`

### Usage
- Order cards use medium shadows to feel clickable
- Modals use large shadows to signify layering
- Buttons lift on hover with shadow increase

## Typography

### Font Family
```css
font-family: 'Inter', system-ui, sans-serif;
```

### Scale
- **Headings**: 1.5rem - 2.25rem
- **Body**: 1rem
- **Small**: 0.875rem
- **Tiny**: 0.75rem

### Weights
- **Light**: 300
- **Normal**: 400
- **Medium**: 500
- **Semibold**: 600
- **Bold**: 700

## Animations & Transitions

### Micro-interactions
- **Base Transition**: `all 0.2s ease-in-out`
- **Hover Effects**: Transform and shadow changes
- **Status Changes**: Smooth color transitions

### Order Animations
- **New Order Entry**: Slide-in from left with highlight pulse
- **Status Updates**: Color transition with checkmark animation
- **Button Hovers**: Lift effect with `translateY(-1px)`

### Keyframes
```css
@keyframes pulse-highlight {
  0%, 100% { box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); }
  50% { box-shadow: 0 4px 20px rgba(251, 191, 36, 0.3); }
}

@keyframes slide-in {
  from { opacity: 0; transform: translateX(-20px); }
  to { opacity: 1; transform: translateX(0); }
}
```

## Component Specifications

### Order Cards
- **Background**: Gradient card background
- **Border**: 4px left border for status indication
- **Animation**: Slide-in on entry, pulse for new orders
- **Hover**: Lift effect with increased shadow

### Buttons
- **Primary**: Gradient background with hover lift
- **States**: Loading spinner, disabled opacity
- **Transitions**: All properties with 200ms duration

### Status Indicators
- **Visual**: Colored dots with labels
- **Animation**: Pulse effect for active states
- **Colors**: Match status color palette

### Analytics Cards
- **Style**: Enhanced cards with top gradient border
- **Hover**: Scale transform (105%)
- **Icons**: Gradient backgrounds with white icons

## Layout Principles

### Spacing System
- **Base Unit**: 0.25rem (4px)
- **Common Spacing**: 1rem, 1.5rem, 2rem, 3rem
- **Card Padding**: 1.5rem (24px)

### Grid System
- **Dashboard**: 4-column grid for stats
- **Orders**: Single column with card spacing
- **Responsive**: Collapses to single column on mobile

### Visual Hierarchy
1. **Header**: Dark gradient with white text
2. **Stats Cards**: Prominent with gradient icons
3. **Order Cards**: Medium elevation with status borders
4. **Background**: Light gray for contrast

## Accessibility

### Color Contrast
- All text meets WCAG AA standards
- Status colors have sufficient contrast
- Focus states clearly visible

### Motion
- Respects `prefers-reduced-motion`
- Subtle animations that don't distract
- Clear state changes without relying only on color

## Implementation Notes

### CSS Custom Properties
All colors, shadows, and transitions defined as CSS variables for consistency and easy theming.

### Component Classes
- `.card` - Base card styling
- `.order-card` - Enhanced order card with status
- `.analytics-card` - Dashboard analytics styling
- `.btn-primary` - Primary button with gradient
- `.app-header` - Header with dark gradient

### Performance
- Hardware-accelerated transforms
- Efficient CSS selectors
- Minimal repaints and reflows