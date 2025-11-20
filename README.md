# 云墨 - AI 辅助小说创作平台

云墨是一个功能强大的 AI 辅助小说创作平台，旨在为写作者提供一个集创作、管理、发布于一体的解决方案。

## 官网

- [云墨写作 - 在线体验](https://www.yunmoxiezuo.com/)
  注册即送 50W 字数，每天还有 1W 免费字数使用

## 主要功能

- **作品编辑器**: 提供一个功能丰富的文本编辑器，支持多种格式和样式，让您专注于创作。
  ![作品编辑器](功能/作品编辑器.png)
- **后台管理**: 强大的后台管理系统，可以方便地管理用户、作品、订单等。
  - **后台首页**: 数据一览无余，轻松掌握平台动态。（不是很完善）
    ![后台首页](功能/后台首页界面.png)
  - **会员套餐管理**: 灵活配置会员套餐，满足不同用户需求。
    ![会员套餐管理](功能/后台界面-会员套餐界面.png)
- **生成器**: AI 驱动的内容生成器，帮助您快速产出高质量内容。
  ![生成器](功能/生成器.png)
- **作品管理**:
  ![网站作品管理](功能/网站作品管理.png)

## 技术栈

- **前端**:
  - [React](https://reactjs.org/)
  - [Vite](https://vitejs.dev/)
  - [Tailwind CSS](https://tailwindcss.com/)
  - [Tiptap](https://tiptap.dev/) (富文本编辑器)
  - [Zustand](https://github.com/pmndrs/zustand) (状态管理)
- **后端**:
  - [NestJS](https://nestjs.com/)
  - [TypeORM](https://typeorm.io/)
  - [MySQL](https://www.mysql.com/)
- **部署**:
  - [Docker](https://www.docker.com/) （未实现）
  - [Nginx](https://www.nginx.com/)

## 安装与使用

### 环境准备

- **Node.js**: `v20.x` 或更高版本。
- **pnpm**: 建议使用 `pnpm` 作为包管理工具，以确保依赖版本一致。
- **MySQL**: `5.7` 或更高版本。

### 环境配置

在启动后端服务之前，您需要配置必要的环境变量。

1.  进入 `backend` 目录。
2.  复制 `.env.example` 文件并重命名为 `.env`。
    ```bash
    cp .env.example .env
    ```
3.  打开 `.env` 文件，根据您的本地环境修改以下配置：

    - **数据库配置**:

      ```env
      DB_HOST=localhost
      DB_PORT=3306
      DB_USERNAME=root
      DB_PASSWORD=your_mysql_password # 替换为您的MySQL密码
      DB_DATABASE=xiezuo
      ```

    - **JWT 密钥**:
      请务必替换为随机生成的强密钥，以保证应用安全。您可以使用以下命令生成：

      ```bash
      # 生成 JWT_SECRET
      node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
      # 生成 JWT_REFRESH_SECRET
      node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
      ```

      ```env
      JWT_SECRET=your-jwt-secret-key-here
      JWT_REFRESH_SECRET=your-jwt-refresh-secret-key-here
      ```

    - **加密密钥**:
      用于加密敏感数据，同样需要替换为强密钥。
      ```bash
      # 生成 ENCRYPTION_KEY
      node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
      ```
      ```env
      ENCRYPTION_KEY=your-encryption-key-here
      ```

### 本地开发

1.  **克隆项目**

    ```bash
    git clone https://github.com/BaiSugar/yunmoxiezuo.git
    cd yunmoxiezuo
    ```

2.  **启动后端服务**

    ```bash
    cd backend
    npm install
    npm start:dev
    ```

3.  **启动前端服务**

    ```bash
    cd ../frontend
    npm install
    npm dev
    ```

4.  **启动管理后台**
    ```bash
    cd ../admin
    npm install
    npm dev
    ```

## 创建管理员账号

首次部署项目时，您需要手动创建一个超级管理员账户。请按照以下步骤操作：

1.  确保后端服务已成功连接到数据库。
2.  在 `backend` 目录下，运行以下命令：
    ```bash
    npm run init:admin
    ```
3.  根据提示，依次输入管理员的**邮箱**和**密码**。
4.  脚本执行成功后，您的管理员账户即创建完毕。您可以使用该账户登录管理后台。

**注意**：此脚本只能在数据库中没有用户时，或指定的管理员邮箱未被注册时使用。

## 注意事项

- 目前项目只支持兼容 OpenAI 的 API 接口。

## 社区与支持

- QQ 群 （1046148040）
  ![](功能/QQ群.jpg)
