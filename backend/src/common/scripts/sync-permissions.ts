/**
 * 权限自动同步工具
 * 用途：根据代码中的权限常量自动同步到数据库
 * 使用：npm run sync:permissions
 */

import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// 加载环境变量
dotenv.config({ path: path.join(__dirname, '../../../.env.local') });
dotenv.config({ path: path.join(__dirname, '../../../.env') });

// 权限定义（与 permissions.constant.ts 保持一致）
const PERMISSIONS_DEFINITION = {
  // 用户管理
  USER: {
    parent: { name: '用户管理', code: 'user', type: 'menu' },
    children: [
      { name: '查看用户列表', code: 'user:list', type: 'api', resource: '/api/v1/users', method: 'GET' },
      { name: '查看用户详情', code: 'user:view', type: 'api', resource: '/api/v1/users/:id', method: 'GET' },
      { name: '创建用户', code: 'user:create', type: 'api', resource: '/api/v1/users', method: 'POST' },
      { name: '更新用户', code: 'user:update', type: 'api', resource: '/api/v1/users/:id', method: 'PATCH' },
      { name: '删除用户', code: 'user:delete', type: 'api', resource: '/api/v1/users/:id', method: 'DELETE' },
      { name: '封禁用户', code: 'user:ban', type: 'button', resource: null, method: null },
      { name: '分配角色', code: 'user:assign_roles', type: 'button', resource: null, method: null },
    ],
  },

  // 角色管理
  ROLE: {
    parent: { name: '角色管理', code: 'permission:role', type: 'menu' },
    children: [
      { name: '查看角色列表', code: 'permission:role:list', type: 'api', resource: '/api/v1/roles', method: 'GET' },
      { name: '创建角色', code: 'permission:role:create', type: 'api', resource: '/api/v1/roles', method: 'POST' },
      { name: '更新角色', code: 'permission:role:update', type: 'api', resource: '/api/v1/roles/:id', method: 'PATCH' },
      { name: '删除角色', code: 'permission:role:delete', type: 'api', resource: '/api/v1/roles/:id', method: 'DELETE' },
      { name: '分配权限', code: 'permission:role:assign', type: 'button', resource: null, method: null },
    ],
  },

  // 权限管理
  PERMISSION: {
    parent: { name: '权限管理', code: 'permission', type: 'menu' },
    children: [
      { name: '查看权限列表', code: 'permission:list', type: 'api', resource: '/api/v1/permissions', method: 'GET' },
      { name: '创建权限', code: 'permission:create', type: 'api', resource: '/api/v1/permissions', method: 'POST' },
      { name: '更新权限', code: 'permission:update', type: 'api', resource: '/api/v1/permissions/:id', method: 'PATCH' },
      { name: '删除权限', code: 'permission:delete', type: 'api', resource: '/api/v1/permissions/:id', method: 'DELETE' },
    ],
  },

  // 提示词管理 ⭐ NEW
  PROMPT: {
    parent: { name: '提示词管理', code: 'prompt', type: 'menu' },
    children: [
      // 分类管理
      { name: '查看提示词分类', code: 'prompt:category:view', type: 'menu', resource: '/api/v1/prompt-categories', method: 'GET' },
      { name: '创建提示词分类', code: 'prompt:category:create', type: 'api', resource: '/api/v1/prompt-categories', method: 'POST' },
      { name: '更新提示词分类', code: 'prompt:category:update', type: 'api', resource: '/api/v1/prompt-categories/:id', method: 'PATCH' },
      { name: '删除提示词分类', code: 'prompt:category:delete', type: 'api', resource: '/api/v1/prompt-categories/:id', method: 'DELETE' },
      
      // 提示词CRUD
      { name: '查看提示词列表', code: 'prompt:list', type: 'api', resource: '/api/v1/prompts', method: 'GET' },
      { name: '查看提示词详情', code: 'prompt:view', type: 'api', resource: '/api/v1/prompts/:id', method: 'GET' },
      { name: '创建提示词', code: 'prompt:create', type: 'api', resource: '/api/v1/prompts', method: 'POST' },
      { name: '更新提示词', code: 'prompt:update', type: 'api', resource: '/api/v1/prompts/:id', method: 'PATCH' },
      { name: '删除提示词', code: 'prompt:delete', type: 'api', resource: '/api/v1/prompts/:id', method: 'DELETE' },
      { name: '使用提示词', code: 'prompt:use', type: 'button', resource: null, method: null },
      { name: '发布提示词', code: 'prompt:publish', type: 'button', resource: null, method: null },
      
      // 管理员权限
      { name: '管理所有提示词', code: 'prompt:manage:all', type: 'api', resource: null, method: null },
      { name: '审核提示词', code: 'prompt:review', type: 'button', resource: null, method: null },
      { name: '强制删除提示词', code: 'prompt:force_delete', type: 'button', resource: null, method: null },
    ],
  },
};

async function syncPermissions() {
  console.log('🔄 开始同步权限到数据库...\n');

  // 创建数据库连接
  const dataSource = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'xiezuo',
    entities: [],
    synchronize: false,
  });

  try {
    await dataSource.initialize();
    console.log('✅ 数据库连接成功\n');

    let parentCount = 0;
    let childCount = 0;
    let updateCount = 0;
    let skipCount = 0;

    // 遍历所有模块
    for (const [moduleName, moduleData] of Object.entries(PERMISSIONS_DEFINITION)) {
      const { parent, children } = moduleData;

      console.log(`📦 处理模块: ${parent.name}`);

      // 1. 处理父权限
      const parentResult = await dataSource.query(
        `SELECT id FROM permissions WHERE code = ?`,
        [parent.code]
      );

      let parentId: number;
      if (parentResult.length === 0) {
        // 插入父权限
        const insertResult = await dataSource.query(
          `INSERT INTO permissions (parent_id, name, code, type, resource, method, description, sort_order, status)
           VALUES (NULL, ?, ?, ?, NULL, NULL, ?, ?, 'active')`,
          [parent.name, parent.code, parent.type, `${parent.name}模块`, parentCount * 100]
        );
        parentId = insertResult.insertId;
        parentCount++;
        console.log(`  ✅ 新增父权限: ${parent.code}`);
      } else {
        parentId = parentResult[0].id;
        skipCount++;
        console.log(`  ⏭️  父权限已存在: ${parent.code}`);
      }

      // 2. 处理子权限
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        const childResult = await dataSource.query(
          `SELECT id FROM permissions WHERE code = ?`,
          [child.code]
        );

        if (childResult.length === 0) {
          // 插入子权限
          await dataSource.query(
            `INSERT INTO permissions (parent_id, name, code, type, resource, method, description, sort_order, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
            [
              parentId,
              child.name,
              child.code,
              child.type,
              child.resource,
              child.method,
              child.name,
              i + 1,
            ]
          );
          childCount++;
          console.log(`    ✅ 新增子权限: ${child.code}`);
        } else {
          // 更新子权限（确保信息是最新的）
          await dataSource.query(
            `UPDATE permissions SET name = ?, type = ?, resource = ?, method = ?, description = ? WHERE code = ?`,
            [child.name, child.type, child.resource, child.method, child.name, child.code]
          );
          updateCount++;
          console.log(`    🔄 更新子权限: ${child.code}`);
        }
      }

      console.log('');
    }

    // 3. 自动为超级管理员分配所有新权限
    console.log('🔐 为超级管理员分配新权限...');
    const assignResult = await dataSource.query(
      `INSERT IGNORE INTO role_permissions (role_id, permission_id)
       SELECT 1, id FROM permissions WHERE id NOT IN (
         SELECT permission_id FROM role_permissions WHERE role_id = 1
       )`
    );
    console.log(`✅ 为超级管理员分配了 ${assignResult.affectedRows} 个新权限\n`);

    // 4. 统计信息
    console.log('📊 同步完成统计:');
    console.log(`  - 新增父权限: ${parentCount}`);
    console.log(`  - 新增子权限: ${childCount}`);
    console.log(`  - 更新权限: ${updateCount}`);
    console.log(`  - 跳过权限: ${skipCount}`);
    console.log('');

    // 5. 显示所有权限
    const allPermissions = await dataSource.query(
      `SELECT COUNT(*) as total FROM permissions`
    );
    console.log(`📋 数据库中共有 ${allPermissions[0].total} 个权限`);

    const superAdminPermissions = await dataSource.query(
      `SELECT COUNT(*) as total FROM role_permissions WHERE role_id = 1`
    );
    console.log(`👑 超级管理员拥有 ${superAdminPermissions[0].total} 个权限\n`);

    console.log('✅ 权限同步完成！');

  } catch (error) {
    console.error('❌ 同步失败:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

// 执行同步
syncPermissions();
