import { DataSource } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import * as dotenv from 'dotenv';
import * as path from 'path';

// 加载环境变量
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

/**
 * 生成唯一邀请码
 * 格式：8位随机大写字母+数字
 * 规则：至少3个字母，至少2个数字，不能纯数字
 */
async function generateInviteCode(dataSource: DataSource): Promise<string> {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  let code = '';

  // 确保至少3个字母
  for (let i = 0; i < 3; i++) {
    code += letters.charAt(Math.floor(Math.random() * letters.length));
  }

  // 确保至少2个数字
  for (let i = 0; i < 2; i++) {
    code += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }

  // 剩余3位从字母和数字中随机选择
  const allChars = letters + numbers;
  for (let i = 0; i < 3; i++) {
    code += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }

  // 打乱顺序
  code = code
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');

  // 检查是否重复，如果重复则重新生成
  const userRepository = dataSource.getRepository(User);
  const existing = await userRepository.findOne({
    where: { inviteCode: code },
  });

  if (existing) {
    // 递归重新生成
    return generateInviteCode(dataSource);
  }

  return code;
}

/**
 * 批量修复缺失的邀请码
 */
async function fixMissingInviteCodes() {
  console.log('🔧 开始修复缺失的邀请码...\n');

  // 创建数据库连接
  const dataSource = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'xiezuo',
    entities: [User],
    synchronize: false,
  });

  try {
    await dataSource.initialize();
    console.log('✅ 数据库连接成功\n');

    const userRepository = dataSource.getRepository(User);

    // 查找没有邀请码的用户
    const usersWithoutCode = await userRepository
      .createQueryBuilder('user')
      .where('user.inviteCode IS NULL')
      .orWhere('user.inviteCode = :empty', { empty: '' })
      .getMany();

    if (usersWithoutCode.length === 0) {
      console.log('✅ 所有用户都已有邀请码，无需修复\n');
      return;
    }

    console.log(`📊 找到 ${usersWithoutCode.length} 个用户缺少邀请码\n`);
    console.log('开始生成邀请码...\n');

    let successCount = 0;
    let failCount = 0;

    for (const user of usersWithoutCode) {
      try {
        const inviteCode = await generateInviteCode(dataSource);
        await userRepository.update(user.id, { inviteCode });
        
        console.log(
          `✅ [${successCount + 1}/${usersWithoutCode.length}] 用户 #${user.id} (${user.username}) 邀请码已生成: ${inviteCode}`
        );
        successCount++;
      } catch (error) {
        console.error(
          `❌ 用户 #${user.id} (${user.username}) 邀请码生成失败:`,
          error.message
        );
        failCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 修复完成统计:');
    console.log(`   ✅ 成功: ${successCount} 个`);
    console.log(`   ❌ 失败: ${failCount} 个`);
    console.log(`   📌 总计: ${usersWithoutCode.length} 个`);
    console.log('='.repeat(60) + '\n');

    // 验证结果
    const remainingUsers = await userRepository
      .createQueryBuilder('user')
      .where('user.inviteCode IS NULL')
      .orWhere('user.inviteCode = :empty', { empty: '' })
      .getCount();

    if (remainingUsers === 0) {
      console.log('🎉 所有用户的邀请码已全部修复！\n');
    } else {
      console.log(`⚠️  仍有 ${remainingUsers} 个用户缺少邀请码，请检查日志\n`);
    }
  } catch (error) {
    console.error('❌ 修复过程发生错误:', error);
    throw error;
  } finally {
    await dataSource.destroy();
    console.log('📡 数据库连接已关闭\n');
  }
}

// 执行脚本
fixMissingInviteCodes()
  .then(() => {
    console.log('✅ 脚本执行完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 脚本执行失败:', error);
    process.exit(1);
  });
