# Nav-Item Logo 数据流图示

## 完整架构图

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Nav-Item 架构                                  │
│                                                                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐              │
│  │   数据库层    │◄──►│  后端 API 层  │◄──►│  前端展示层   │              │
│  │   SQLite     │    │   Express    │    │    Vue 3     │              │
│  └──────────────┘    └──────────────┘    └──────────────┘              │
│         ▲                    ▲                    ▲                      │
│         │                    │                    │                      │
│         └────────────────────┴────────────────────┘                      │
│                      Logo 数据流动                                        │
└─────────────────────────────────────────────────────────────────────────┘
```

## Layer 1: 数据库层 (SQLite)

```sql
┌───────────────────────────────────────────────────────────┐
│  cards 表                                                  │
├───────────────────────────────────────────────────────────┤
│  id                INTEGER PRIMARY KEY                     │
│  menu_id           INTEGER                                 │
│  sub_menu_id       INTEGER                                 │
│  title             TEXT NOT NULL                           │
│  url               TEXT NOT NULL                           │
│  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓    │
│  ┃ logo_url         TEXT           # 外部 logo URL  ┃    │
│  ┃ custom_logo_path TEXT           # 上传文件名     ┃    │
│  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛    │
│  desc              TEXT                                    │
│  "order"           INTEGER                                 │
└───────────────────────────────────────────────────────────┘
```

**字段说明**:
- `logo_url`: 存储外部图片链接（如 CDN、第三方网站的 logo）
- `custom_logo_path`: 存储上传到服务器的文件名（如 `1732456789123.png`）

## Layer 2: 后端 API 层 (Express)

### 2.1 目录结构

```
/
├── routes/
│   ├── card.js          # 卡片 CRUD API
│   └── upload.js        # 文件上传 API
├── uploads/             # 上传文件存储目录
│   ├── 1732456789123.png
│   ├── 1732456789456.jpg
│   └── ...
├── app.js               # 主应用（包含静态文件服务）
└── db.js                # 数据库初始化
```

### 2.2 API 端点

```
┌─────────────────────────────────────────────────────────────┐
│  Express 路由                                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  GET  /api/cards/:menuId                                    │
│       ↓                                                      │
│       查询数据库 → 计算 display_logo                         │
│       ↓                                                      │
│       返回 JSON (包含 display_logo 字段)                     │
│                                                              │
│  POST /api/cards                                            │
│       ↓                                                      │
│       接收 { title, url, logo_url, custom_logo_path }       │
│       ↓                                                      │
│       INSERT INTO cards (...)                               │
│                                                              │
│  PUT  /api/cards/:id                                        │
│       ↓                                                      │
│       接收 { logo_url, custom_logo_path, ... }              │
│       ↓                                                      │
│       UPDATE cards SET ... WHERE id = ?                     │
│                                                              │
│  POST /api/upload                                           │
│       ↓                                                      │
│       multer 接收文件 (FormData)                            │
│       ↓                                                      │
│       保存到 /uploads/timestamp.ext                         │
│       ↓                                                      │
│       返回 { filename, url }                                │
│                                                              │
│  GET  /uploads/:filename  (静态文件服务)                    │
│       ↓                                                      │
│       返回图片文件                                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 Logo 计算逻辑 (card.js)

```javascript
// GET /api/cards/:menuId
rows.forEach(card => {
  if (!card.custom_logo_path) {
    // 分支 A: 没有上传文件
    card.display_logo = card.logo_url || (card.url + '/favicon.ico');
  } else {
    // 分支 B: 有上传文件
    card.display_logo = '/uploads/' + card.custom_logo_path;
  }
});

/*
决策树:
            有 custom_logo_path?
                 /        \
              是           否
              |            |
       '/uploads/xxx'   有 logo_url?
                         /        \
                       是          否
                       |           |
                   logo_url   domain/favicon.ico
*/
```

## Layer 3: 前端层 (Vue 3)

### 3.1 管理后台流程 (Admin Panel)

```
┌────────────────────────────────────────────────────────────────┐
│  CardManage.vue (管理面板)                                      │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [添加卡片表单]                                                 │
│  ┌───────────────────────────────────────────────────────┐    │
│  │  卡片标题: [_____________]                             │    │
│  │  卡片链接: [_____________]                             │    │
│  │  Logo链接: [_____________]  ← ⚠️ 只有文本输入框        │    │
│  │                                                        │    │
│  │  ❌ 缺少: <input type="file"> 文件上传控件             │    │
│  │                                                        │    │
│  │  [添加卡片]                                            │    │
│  └───────────────────────────────────────────────────────┘    │
│                                                                 │
│  点击 "添加卡片"                                                │
│         ↓                                                       │
│  addCard() {                                                   │
│    await apiAddCard({                                          │
│      title: '...',                                             │
│      url: '...',                                               │
│      logo_url: '...',    ← 只传 logo_url                       │
│      // ❌ 没有 custom_logo_path                               │
│    })                                                          │
│  }                                                             │
│         ↓                                                       │
│  POST /api/cards                                               │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

**当前问题**: 管理面板只能输入外部 URL，无法上传本地文件

### 3.2 理想的上传流程（需要实现）

```
┌────────────────────────────────────────────────────────────────┐
│  改进后的 CardManage.vue                                        │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [添加卡片表单]                                                 │
│  ┌───────────────────────────────────────────────────────┐    │
│  │  卡片标题: [_____________]                             │    │
│  │  卡片链接: [_____________]                             │    │
│  │                                                        │    │
│  │  Logo 方式一: 外部链接                                 │    │
│  │  └─ [_____________]                                    │    │
│  │                                                        │    │
│  │  Logo 方式二: 上传文件                                 │    │
│  │  └─ <input type="file"> [选择文件]                     │    │
│  │         ↓                                              │    │
│  │     handleFileUpload(event) {                          │    │
│  │       const file = event.target.files[0]               │    │
│  │       const res = await uploadLogo(file)  ─────┐      │    │
│  │       uploadedLogoPath.value = res.data.filename      │    │
│  │     }                                           │      │    │
│  │                                                 │      │    │
│  │  [添加卡片]                                     │      │    │
│  └─────────────────────────────────────────────────┼──────┘    │
│                                                    │            │
│                                              POST /api/upload   │
│                                                    │            │
│                                  ┌─────────────────┘            │
│                                  ↓                              │
│                            multer 处理文件                      │
│                                  ↓                              │
│                    保存到 /uploads/1732456789123.png           │
│                                  ↓                              │
│                    返回 { filename: '1732456789123.png' }      │
│                                  ↓                              │
│  addCard() {                    │                              │
│    await apiAddCard({            │                              │
│      title: '...',               │                              │
│      url: '...',                 │                              │
│      logo_url: '',               │                              │
│      custom_logo_path: uploadedLogoPath.value  ←─┘             │
│    })                                                           │
│  }                                                             │
│         ↓                                                       │
│  POST /api/cards                                               │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### 3.3 前端显示流程 (Home Page)

```
┌────────────────────────────────────────────────────────────────┐
│  Home.vue (主页)                                                │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  onMounted() {                                                 │
│    await loadCards()                                           │
│  }                                                             │
│         ↓                                                       │
│  GET /api/cards/:menuId                                        │
│         ↓                                                       │
│  返回 cards: [                                                 │
│    {                                                           │
│      id: 1,                                                    │
│      title: 'YouTube',                                         │
│      logo_url: 'https://...',                                  │
│      custom_logo_path: null,                                   │
│      display_logo: 'https://...'  ← 后端计算好的               │
│    },                                                          │
│    ...                                                         │
│  ]                                                             │
│         ↓                                                       │
│  <CardGrid :cards="cards" />                                   │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

```
┌────────────────────────────────────────────────────────────────┐
│  CardGrid.vue (卡片网格组件)                                    │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  <div v-for="card in cards" class="link-item">                 │
│    <a :href="card.url">                                        │
│      <img :src="getLogo(card)"                                 │
│           @error="onImgError">                                 │
│      <span>{{ card.title }}</span>                             │
│    </a>                                                        │
│  </div>                                                        │
│                                                                 │
│  getLogo(card) {                                               │
│    ┌─────────────────────────────────────┐                    │
│    │ 有 custom_logo_path?                │                    │
│    └───────────┬──────────────────────┬──┘                    │
│              是│                     否│                       │
│                ↓                       ↓                       │
│    返回 '/uploads/xxx.png'      有 logo_url?                   │
│                                  ┌─────┴─────┐                │
│                                是│           否│               │
│                                  ↓             ↓               │
│                          返回 logo_url  返回 domain/favicon.ico│
│  }                                                             │
│                                                                 │
│  onImgError(e) {                                               │
│    e.target.src = '/default-favicon.png'  ← 兜底图标           │
│  }                                                             │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

## 完整流程时序图

### 场景 1: 使用外部 logo URL (当前支持)

```
Admin      CardManage      Express       SQLite      Home       CardGrid
  |             |             |            |          |            |
  |-- 输入 -->   |             |            |          |            |
  |  title      |             |            |          |            |
  |  url        |             |            |          |            |
  |  logo_url   |             |            |          |            |
  |             |             |            |          |            |
  |         [添加卡片]         |            |          |            |
  |             |-- POST ---->|            |          |            |
  |             |  /api/cards |            |          |            |
  |             |             |-- INSERT -->|         |            |
  |             |             |   cards    |          |            |
  |             |<---- OK ----|            |          |            |
  |<-- 刷新列表 -|             |            |          |            |
  |             |             |            |          |            |
  |             |             |            |    用户访问主页       |
  |             |             |            |          |            |
  |             |             |<--- GET ---|          |            |
  |             |             | /api/cards |          |            |
  |             |             |            |          |            |
  |             |             |-- SELECT -->|         |            |
  |             |             |<-- data ---|          |            |
  |             |             |            |          |            |
  |             |             | 计算 display_logo     |            |
  |             |             | = logo_url |          |            |
  |             |             |            |          |            |
  |             |             |---- JSON -->|         |            |
  |             |             |            |          |            |
  |             |             |            |    <CardGrid :cards> |
  |             |             |            |          |            |
  |             |             |            |          |-- getLogo() ->
  |             |             |            |          |            |
  |             |             |            |          |<img src="logo_url">
  |             |             |            |          |            |
```

### 场景 2: 上传本地 logo 文件 (需要完善)

```
Admin      CardManage      Express       File        SQLite      Home
  |             |             |          System       |           |
  |-- 选择文件 ->|             |            |          |           |
  |  logo.png   |             |            |          |           |
  |             |             |            |          |           |
  |         [上传文件]         |            |          |           |
  |             |-- POST ---->|            |          |           |
  |             | /api/upload |            |          |           |
  |             | FormData    |            |          |           |
  |             |             |            |          |           |
  |             |          multer          |          |           |
  |             |             |-- 写入 --->|          |           |
  |             |             |  /uploads/ |          |           |
  |             |             |  timestamp.png        |           |
  |             |             |<-- OK -----|          |           |
  |             |<- filename -|            |          |           |
  |             |   返回      |            |          |           |
  |             |             |            |          |           |
  |         [添加卡片]         |            |          |           |
  |             |-- POST ---->|            |          |           |
  |             | /api/cards  |            |          |           |
  |             | custom_logo_path: 'timestamp.png'   |           |
  |             |             |            |          |           |
  |             |             |-- INSERT -->|         |           |
  |             |             |<-- OK -----|          |           |
  |             |<---- OK ----|            |          |           |
  |             |             |            |          |           |
  |             |             |            |    用户访问主页       |
  |             |             |            |          |           |
  |             |             |<--- GET ---|          |           |
  |             |             | /api/cards |          |           |
  |             |             |            |          |           |
  |             |             |-- SELECT -->|         |           |
  |             |             |<-- data ---|          |           |
  |             |             |            |          |           |
  |             |             | 计算 display_logo     |           |
  |             |             | = '/uploads/' + custom_logo_path  |
  |             |             |            |          |           |
  |             |             |---- JSON -->|         |           |
  |             |             |            |          |           |
  |             |             |            |    <img src="/uploads/...">
  |             |             |            |          |           |
  |             |             |<--- GET ---|          |           |
  |             |             | /uploads/timestamp.png            |
  |             |             |            |          |           |
  |             |             |-- 读取 --->|          |           |
  |             |             |<-- 文件 ---|          |           |
  |             |             |---- 图片 -->|         |           |
  |             |             |            |          |显示       |
```

## Logo 优先级决策树

```
                    获取卡片数据
                         |
                         ↓
            ┌────────────────────────┐
            │ custom_logo_path 存在？│
            └────────────┬───────────┘
                   YES ↙    ↘ NO
                      ↓        ↓
        ┌─────────────────┐  ┌──────────────┐
        │ 使用上传的文件   │  │ logo_url 存在？│
        │ /uploads/xxx    │  └──────┬───────┘
        └─────────────────┘   YES ↙   ↘ NO
                 ↓                ↓       ↓
          ┌─────────────┐  ┌─────────────────┐  ┌──────────────────┐
          │ 加载成功？   │  │ 使用外部 URL     │  │ 使用网站 favicon  │
          └──────┬──────┘  │ https://...     │  │ domain/favicon.ico│
           YES ↙   ↘ NO    └─────────────────┘  └──────────────────┘
              ↓       ↓              ↓                    ↓
        ┌─────────┐  │         ┌─────────┐         ┌─────────┐
        │ 显示图片│  │         │加载成功？│         │加载成功？│
        └─────────┘  │         └────┬────┘         └────┬────┘
                     │        YES ↙  ↘ NO          YES ↙  ↘ NO
                     │           ↓      ↓             ↓      ↓
                     │      ┌─────────┐│        ┌─────────┐ │
                     │      │ 显示图片││        │ 显示图片│ │
                     │      └─────────┘│        └─────────┘ │
                     │                 │                    │
                     └─────────────────┴────────────────────┘
                                       ↓
                            ┌──────────────────────┐
                            │ 显示默认图标          │
                            │ /default-favicon.png │
                            └──────────────────────┘
```

## 文件系统结构

```
nav-item/
│
├── database/
│   └── nav.db                     # SQLite 数据库
│       └── cards 表
│           ├── logo_url           # 字段1: 外部 URL
│           └── custom_logo_path   # 字段2: 上传文件名
│
├── uploads/                       # 上传文件存储目录
│   ├── 1732456789123.png         # ← custom_logo_path 指向这里
│   ├── 1732456789456.jpg
│   └── ...
│
├── routes/
│   ├── card.js                   # 卡片 API
│   │   ├── GET  /api/cards/:menuId
│   │   ├── POST /api/cards
│   │   └── PUT  /api/cards/:id
│   └── upload.js                 # 上传 API
│       └── POST /api/upload
│
├── web/
│   └── src/
│       ├── api.js                # API 封装
│       │   ├── getCards()
│       │   ├── addCard()
│       │   └── uploadLogo()      # ✅ 已实现但未使用
│       │
│       ├── views/
│       │   ├── Home.vue          # 主页
│       │   └── admin/
│       │       └── CardManage.vue # 管理面板
│       │           └── ⚠️ 缺少文件上传 UI
│       │
│       └── components/
│           └── CardGrid.vue      # 卡片网格
│               ├── getLogo()     # Logo 获取逻辑
│               └── onImgError()  # 错误处理
│
└── app.js                        # 主应用
    └── app.use('/uploads', ...)  # 静态文件服务
```

## API 数据格式

### GET /api/cards/:menuId 响应

```json
[
  {
    "id": 1,
    "title": "YouTube",
    "url": "https://www.youtube.com",
    "logo_url": "https://img.icons8.com/youtube.png",
    "custom_logo_path": null,
    "desc": "全球最大的视频社区",
    "order": 0,
    "display_logo": "https://img.icons8.com/youtube.png"  ← 后端计算
  },
  {
    "id": 2,
    "title": "My Site",
    "url": "https://mysite.com",
    "logo_url": null,
    "custom_logo_path": "1732456789123.png",
    "desc": "我的网站",
    "order": 1,
    "display_logo": "/uploads/1732456789123.png"  ← 后端计算
  },
  {
    "id": 3,
    "title": "GitHub",
    "url": "https://github.com",
    "logo_url": "",
    "custom_logo_path": null,
    "desc": "代码托管平台",
    "order": 2,
    "display_logo": "https://github.com/favicon.ico"  ← 后端计算
  }
]
```

### POST /api/upload 请求/响应

**请求** (FormData):
```
Content-Type: multipart/form-data

logo: [File Binary Data]
```

**响应** (JSON):
```json
{
  "filename": "1732456789123.png",
  "url": "/uploads/1732456789123.png"
}
```

### POST /api/cards 请求

**方式 1: 使用外部 URL**
```json
{
  "menu_id": 1,
  "sub_menu_id": null,
  "title": "YouTube",
  "url": "https://www.youtube.com",
  "logo_url": "https://img.icons8.com/youtube.png",
  "custom_logo_path": null,
  "desc": "视频平台",
  "order": 0
}
```

**方式 2: 使用上传文件**
```json
{
  "menu_id": 1,
  "sub_menu_id": null,
  "title": "My Site",
  "url": "https://mysite.com",
  "logo_url": null,
  "custom_logo_path": "1732456789123.png",  ← 从 /api/upload 获得
  "desc": "我的网站",
  "order": 0
}
```

## 总结

### 数据流向

```
┌─────────────┐
│   Admin     │ 输入 logo_url 或上传文件
│   面板      │ ────────────────────────┐
└─────────────┘                         │
                                        ↓
                              ┌──────────────────┐
                              │  Express 后端    │
                              │  - 接收数据       │
                              │  - 处理文件上传   │
                              │  - 保存到数据库   │
                              └─────────┬────────┘
                                        ↓
                              ┌──────────────────┐
                              │  SQLite 数据库   │
                              │  - logo_url      │
                              │  - custom_logo_path│
                              └─────────┬────────┘
                                        ↓
                              ┌──────────────────┐
                              │  Express 后端    │
                              │  - 查询数据       │
                              │  - 计算 display_logo│
                              └─────────┬────────┘
                                        ↓
┌─────────────┐                         │
│  Home 页面  │ ←───────────────────────┘
│  CardGrid   │ 显示 logo
└─────────────┘
```

### 关键要点

1. **两种 logo 来源**:
   - 外部 URL (`logo_url`)
   - 本地上传 (`custom_logo_path`)

2. **优先级**: 上传文件 > 外部 URL > 网站 favicon > 默认图标

3. **当前缺陷**: 管理面板未实现文件上传 UI

4. **改进方向**: 在 CardManage.vue 添加文件选择器和上传逻辑
