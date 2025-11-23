# 📝 Hướng dẫn sử dụng TextSize Scale

## ✅ Đã hoàn thành
- ✅ TextSizeContext created
- ✅ TextSizeModal created  
- ✅ Provider added to _layout.tsx
- ✅ User có thể chọn Small/Medium/Large

## ⚠️ Cần làm tiếp (Optional)

Để apply text size vào toàn bộ app, cần dùng `scale` từ `useTextSize()` hook:

### Cách sử dụng:

```typescript
import { useTextSize } from '@/contexts/TextSizeContext';

function MyComponent() {
  const { scale } = useTextSize();
  
  return (
    <Text style={{ fontSize: 16 * scale }}>
      Text có thể scale
    </Text>
  );
}
```

### Scales:
- Small: 0.85
- Medium: 1.0  
- Large: 1.15

### Example Component với scaled fonts:

```typescript
import { useTextSize } from '@/contexts/TextSizeContext';

export default function ScaledText({ children, style, ...props }) {
  const { scale } = useTextSize();
  
  // Apply scale to fontSize if it exists in style
  const scaledStyle = useMemo(() => {
    if (Array.isArray(style)) {
      return style.map(s => ({
        ...s,
        fontSize: s?.fontSize ? s.fontSize * scale : undefined
      }));
    }
    return {
      ...style,
      fontSize: style?.fontSize ? style.fontSize * scale : undefined
    };
  }, [style, scale]);
  
  return <Text style={scaledStyle} {...props}>{children}</Text>;
}
```

### Note:
Text size scaling là optional feature. Hiện tại user đã có thể chọn size trong modal nhưng chưa apply vào UI.

Nếu muốn implement đầy đủ, cần:
1. Tạo ScaledText component như trên
2. Replace `<Text>` → `<ScaledText>` trong các screen quan trọng
3. Hoặc override Text component globally (advanced)

