# 人物卡和世界观管理功能

## 📁 目录结构

```
frontend/src/
├── types/
│   └── character.ts                    # 类型定义
├── services/
│   └── characters.api.ts               # API 服务
└── pages/editor/
    ├── characters/                     # 人物卡管理
    │   ├── CharactersPage.tsx         # 主页面
    │   ├── components/
    │   │   ├── CharacterCard.tsx      # 人物卡卡片
    │   │   └── CharacterModal.tsx     # 创建/编辑对话框
    │   └── index.ts                   # 导出
    └── world-settings/                # 世界观管理
        ├── WorldSettingsPage.tsx      # 主页面
        ├── components/
        │   ├── WorldSettingCard.tsx   # 世界观卡片
        │   └── WorldSettingModal.tsx  # 创建/编辑对话框
        └── index.ts                   # 导出
```

## 🚀 如何集成到项目中

### 1. 在路由中添加页面

在 `App.tsx` 或路由配置中添加：

```tsx
import { CharactersPage } from './pages/editor/characters';
import { WorldSettingsPage } from './pages/editor/world-settings';

// 在路由配置中添加
<Route path="/novels/:novelId/characters" element={<CharactersPage />} />
<Route path="/novels/:novelId/world-settings" element={<WorldSettingsPage />} />
```

### 2. 在编辑器导航中添加链接

在 `NovelEditor.tsx` 或导航菜单中：

```tsx
import { User, Globe } from 'lucide-react';

<nav>
  <Link to={`/novels/${novelId}/characters`}>
    <User className="w-5 h-5" />
    <span>人物卡</span>
  </Link>
  
  <Link to={`/novels/${novelId}/world-settings`}>
    <Globe className="w-5 h-5" />
    <span>世界观</span>
  </Link>
</nav>
```

## ✨ 功能特性

### 人物卡管理
- ✅ 创建/编辑/删除人物卡
- ✅ 按分类组织（主角、配角、反派等）
- ✅ 自定义字段（性别、年龄、职业、性格等）
- ✅ 搜索和筛选
- ✅ 卡片式展示

### 世界观管理
- ✅ 创建/编辑/删除世界观设定
- ✅ 按分类组织（地理、武功、势力、历史等）
- ✅ 自定义字段（类型、位置、特点等）
- ✅ 搜索和筛选
- ✅ 卡片式展示

### 自定义字段编辑器
- ✅ 动态添加任意字段
- ✅ 字段名和值均可自定义
- ✅ 支持多行文本输入
- ✅ 删除不需要的字段

### 分类管理
- ✅ 自动提取分类
- ✅ 按分类分组显示
- ✅ 分类筛选器
- ✅ 统计每个分类的数量

## 🎨 UI 设计

### 人物卡页面
- 🔵 蓝色主题
- 📱 响应式设计
- 🎯 卡片式布局
- ✨ 渐变背景

### 世界观页面
- 🟢 绿色主题
- 📱 响应式设计
- 🎯 卡片式布局
- ✨ 渐变背景

## 📝 使用示例

### 创建人物卡

```tsx
// 用户输入
名称: 张无忌
分类: 主角
字段:
  - 性别: 男
  - 年龄: 25
  - 职业: 武当派弟子
  - 武功: 九阳神功、乾坤大挪移
  - 性格: 善良、优柔寡断
```

### 创建世界观设定

```tsx
// 用户输入
名称: 光明顶
分类: 地理
字段:
  - 类型: 山峰
  - 位置: 昆仑山脉
  - 归属: 明教总坛
  - 特点: 地势险要，易守难攻
  - 历史: 明教自元初建立...
```

## 🔧 技术栈

- **React** - UI 框架
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式
- **Lucide React** - 图标
- **React Router** - 路由

## 📚 API 端点

### 人物卡
- `GET /api/v1/characters?novelId={id}` - 获取列表
- `GET /api/v1/characters/{id}` - 获取详情
- `POST /api/v1/characters?novelId={id}` - 创建
- `PATCH /api/v1/characters/{id}` - 更新
- `DELETE /api/v1/characters/{id}` - 删除

### 世界观
- `GET /api/v1/world-settings?novelId={id}` - 获取列表
- `GET /api/v1/world-settings/{id}` - 获取详情
- `POST /api/v1/world-settings?novelId={id}` - 创建
- `PATCH /api/v1/world-settings/{id}` - 更新
- `DELETE /api/v1/world-settings/{id}` - 删除

## 🎯 下一步优化

- [ ] 拖拽排序
- [ ] 批量操作
- [ ] 导入/导出
- [ ] 图片上传（人物头像）
- [ ] 关系图谱
- [ ] 快速模板
- [ ] AI 辅助填充
